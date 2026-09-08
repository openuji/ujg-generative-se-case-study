import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { normalizeForwardedArgs } from "./cli-args.mjs";
import { evaluationDefinitions, validatePostGenerationEvaluation, writeEvaluationResult } from "./evaluation-results.mjs";
import { beginFullApplicationPhase, seedFullApplicationRun, validateFullApplicationRun } from "./full-application-run-utils.mjs";
import { readPhaseState, requireGenerationComplete } from "./phase-state.mjs";
import { loadRealizationProfile, realizationProfileRelativePath } from "./realization-profile.mjs";
import { buildVerificationTasks, verifyFullApplicationRun } from "./verify-full-application-run.mjs";

const canonicalRepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function prepareFixture(t, runName = "model-a") {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ujg-full-run-"));
  t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));
  const repoRoot = path.join(fixtureRoot, "repo");
  const runsRoot = path.join(repoRoot, "experiments", "full-application-generation", "runs");
  fs.mkdirSync(path.join(repoRoot, "ujg"), { recursive: true });
  fs.copyFileSync(path.join(canonicalRepoRoot, "ujg", "workshop-registration.ujg.jsonld"), path.join(repoRoot, "ujg", "workshop-registration.ujg.jsonld"));
  fs.cpSync(path.join(canonicalRepoRoot, "ujg", "schemas"), path.join(repoRoot, "ujg", "schemas"), { recursive: true });
  fs.copyFileSync(path.join(canonicalRepoRoot, "ujg-implementation.yaml"), path.join(repoRoot, "ujg-implementation.yaml"));
  const profileTarget = path.join(repoRoot, realizationProfileRelativePath);
  fs.mkdirSync(path.dirname(profileTarget), { recursive: true });
  fs.copyFileSync(path.join(canonicalRepoRoot, realizationProfileRelativePath), profileTarget);
  fs.cpSync(path.join(canonicalRepoRoot, "references"), path.join(repoRoot, "references"), { recursive: true });
  fs.mkdirSync(runsRoot, { recursive: true });
  const runRoot = seedFullApplicationRun({ repoRoot, runsRoot, runName });
  return { repoRoot, runsRoot, runRoot, runName, profile: loadRealizationProfile(repoRoot) };
}

function relativeFiles(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(root, entry.name);
    return entry.isDirectory() ? relativeFiles(entryPath).map((child) => path.join(entry.name, child)) : [entry.name];
  }).sort();
}

function scriptFor(command) {
  const args = [];
  for (let index = 0; index < command.args.length; index += 1) {
    if (command.args[index] === "--output-dir" && command.args[index + 1] === "{temporary_output}") {
      index += 1;
      continue;
    }
    if (!command.args[index].includes("{")) args.push(command.args[index]);
  }
  return [command.executable, ...args].join(" ");
}

function packageFromContract(name, contract, extraDependencies = {}) {
  return {
    name,
    private: true,
    type: "module",
    scripts: Object.fromEntries(Object.entries(contract.commands).map(([commandName, command]) => [commandName, scriptFor(command)])),
    dependencies: { ...contract.package.dependencies, ...extraDependencies },
    devDependencies: { ...contract.package.dev_dependencies }
  };
}

function updateLock(runRoot, importerPath, contract, extraDependencies = {}) {
  const lockPath = path.join(runRoot, "pnpm-lock.yaml");
  const lock = fs.existsSync(lockPath) ? YAML.parse(fs.readFileSync(lockPath, "utf8")) : {
    lockfileVersion: "9.0",
    importers: {}
  };
  const dependencies = Object.fromEntries(Object.entries({ ...contract.package.dependencies, ...extraDependencies })
    .map(([name, version]) => [name, { specifier: version, version }]));
  const devDependencies = Object.fromEntries(Object.entries(contract.package.dev_dependencies)
    .map(([name, version]) => [name, { specifier: version, version }]));
  lock.importers[importerPath] = { dependencies, devDependencies };
  fs.writeFileSync(lockPath, YAML.stringify(lock));
}

function writeRequiredFiles(target, groups) {
  for (const alternatives of groups) {
    const selected = alternatives[0];
    const file = path.join(target, selected);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const content = selected.endsWith(".json") ? "{}\n" : "export default {};\n";
    fs.writeFileSync(file, content);
  }
}

function materializeStructure(context) {
  const { runRoot, profile } = context;
  const target = path.join(runRoot, "design-system");
  const contract = profile.target_profiles.design_system;
  fs.writeFileSync(path.join(runRoot, "package.json"), `${JSON.stringify({
    private: true,
    packageManager: `${profile.package_manager.name}@${profile.package_manager.version}`,
    engines: { node: `>=${profile.host.node_version}` }
  }, null, 2)}\n`);
  fs.writeFileSync(path.join(runRoot, profile.package_manager.workspace_file), "packages:\n  - design-system\n  - apps/*\n");
  fs.mkdirSync(path.join(target, "generated"), { recursive: true });
  fs.writeFileSync(path.join(target, "package.json"), `${JSON.stringify(packageFromContract("@fixture/design-system", contract), null, 2)}\n`);
  writeRequiredFiles(target, contract.required_file_groups);

  const ujg = JSON.parse(fs.readFileSync(path.join(runRoot, "ujg", "workshop-registration.ujg.jsonld"), "utf8"));
  const artifacts = ujg.nodes.filter((node) => ["Component", "Template"].includes(node["@type"])).map((node, index) => {
    const exportName = `Artifact${index}`;
    const directory = node["@type"] === "Template" ? "templates" : "components";
    const module = `./${directory}/${exportName}/${exportName}.tsx`;
    const modulePath = path.join(target, module);
    fs.mkdirSync(path.dirname(modulePath), { recursive: true });
    fs.writeFileSync(modulePath, `export function ${exportName}() { return <div />; }\n`);
    fs.writeFileSync(modulePath.replace(/\.tsx$/, ".stories.tsx"), `import { ${exportName} } from "./${exportName}";\nexport default { component: ${exportName} };\n`);
    return { ujgRef: node["@id"], type: node["@type"], module, export: exportName };
  });
  fs.writeFileSync(path.join(target, "generated", "ds-bindings.manifest.json"), `${JSON.stringify({ artifacts }, null, 2)}\n`);
  const entryPath = path.join(target, contract.artifact_entry_files[0]);
  fs.mkdirSync(path.dirname(entryPath), { recursive: true });
  fs.writeFileSync(entryPath, `${artifacts.map((artifact) => `export { ${artifact.export} } from "../${artifact.module.slice(2).replace(/\.tsx$/, "")}";`).join("\n")}\n`);
  fs.writeFileSync(path.join(target, "src", "artifacts.test.ts"), `import { render } from "@testing-library/react";\nimport { expect, test } from "vitest";\nimport { ${artifacts[0].export} } from "./index";\ntest("artifact", () => expect(render(${artifacts[0].export}()).container).toBeTruthy());\n`);
  updateLock(runRoot, "design-system", contract);
  return target;
}

function evidence(relativePath, classification, profile) {
  return {
    [profile.themes.provenance_extension]: {
      [profile.themes.provenance_paths_field]: [relativePath],
      basis: "fixture evidence",
      [profile.themes.provenance_classification_field]: classification
    }
  };
}

function materializeTokens(context) {
  const { repoRoot, runRoot, profile } = context;
  const tokenRoot = path.join(runRoot, "design", "tokens");
  fs.mkdirSync(tokenRoot, { recursive: true });
  const screen = path.relative(repoRoot, fs.readdirSync(path.join(repoRoot, profile.themes.evidence_root))
    .map((name) => path.join(repoRoot, profile.themes.evidence_root, name))
    .find((file) => fs.statSync(file).isFile())).split(path.sep).join("/");
  const foundation = { palette: {} };
  for (const themeName of profile.themes.names) {
    for (const [index, role] of profile.themes.required_semantic_roles.entries()) {
      foundation.palette[`${themeName}${role}`] = {
        $type: "color",
        $value: { colorSpace: "srgb", components: themeName === profile.themes.names[0] ? [0.9 - index / 100, 0.9, 0.9] : [0.1 + index / 100, 0.1, 0.1] }
      };
    }
  }
  fs.writeFileSync(path.join(tokenRoot, "foundation.tokens.json"), `${JSON.stringify(foundation, null, 2)}\n`);

  const semanticFiles = [];
  for (const [themeIndex, themeName] of profile.themes.names.entries()) {
    const semantic = { semantic: {} };
    for (const role of profile.themes.required_semantic_roles) {
      semantic.semantic[role] = {
        $type: "color",
        $value: `{palette.${themeName}${role}}`,
        $extensions: evidence(
          screen,
          themeIndex === 0 ? profile.themes.light_evidence : profile.themes.dark_evidence,
          profile
        )
      };
    }
    const fileName = `${themeName}.tokens.json`;
    semanticFiles.push(fileName);
    fs.writeFileSync(path.join(tokenRoot, fileName), `${JSON.stringify(semantic, null, 2)}\n`);
  }

  const ujgPath = path.join(runRoot, "ujg", "workshop-registration.ujg.jsonld");
  const ujg = JSON.parse(fs.readFileSync(ujgPath, "utf8"));
  const foundationId = "urn:ujg:token-source:fixture-foundation";
  const semanticIds = profile.themes.names.map((name) => `urn:ujg:token-source:fixture-${name}`);
  ujg.nodes.push({ "@type": "TokenSource", "@id": foundationId, label: "Fixture foundation", source: "../design/tokens/foundation.tokens.json" });
  profile.themes.names.forEach((name, index) => ujg.nodes.push({
    "@type": "TokenSource",
    "@id": semanticIds[index],
    label: `Fixture ${name} semantics`,
    source: `../design/tokens/${semanticFiles[index]}`
  }));
  profile.themes.names.forEach((name, index) => ujg.nodes.push({
    "@type": "Theme",
    "@id": `urn:ujg:theme:fixture-${name}`,
    label: `Fixture ${name}`,
    tokenSourceRefs: [foundationId, semanticIds[index]]
  }));
  fs.writeFileSync(ujgPath, `${JSON.stringify(ujg, null, 2)}\n`);
}

function materializeStyling(context) {
  const target = path.join(context.runRoot, "design-system");
  fs.mkdirSync(path.join(target, "src"), { recursive: true });
  fs.writeFileSync(path.join(target, "src", "theme.ts"), "import { readFileSync } from 'node:fs';\nconst model = JSON.parse(readFileSync('ujg.jsonld', 'utf8'));\nexport const pipeline = model.tokenSourceRefs.map((entry) => entry.source);\n");
  fs.writeFileSync(path.join(target, "src", "styles.css"), "@import \"tailwindcss\";\n:root { color: var(--text); }\n");
  fs.writeFileSync(path.join(target, "vite.config.ts"), "import tailwindcss from '@tailwindcss/vite';\nexport default { plugins: [tailwindcss()] };\n");
  fs.writeFileSync(path.join(target, ".storybook", "preview.ts"), "export const globalTypes = {};\ndocument.documentElement.setAttribute('data-theme', '');\n");
}

function materializeEvaluations(context) {
  for (const definition of evaluationDefinitions) {
    const result = JSON.parse(fs.readFileSync(path.join(canonicalRepoRoot, definition.fixture), "utf8"));
    result.run_id = context.runName;
    writeEvaluationResult(context.repoRoot, {
      runName: context.runName,
      phase: definition.phase,
      evaluator: "Fixture",
      result
    });
  }
}

function materializeApplication(context, { evaluations = true } = {}) {
  const { runRoot, profile } = context;
  const domain = path.join(runRoot, "apps", "domain");
  fs.mkdirSync(path.join(domain, "src"), { recursive: true });
  fs.writeFileSync(path.join(domain, "src", "main.mjs"), "export function start() {}\n");
  fs.mkdirSync(path.join(runRoot, "tests"), { recursive: true });
  fs.writeFileSync(path.join(runRoot, "tests", "domain.test.mjs"), "import test from 'node:test';\ntest('fixture', () => {});\n");

  const target = path.join(runRoot, "apps", "ui");
  const contract = profile.target_profiles.browser_interface;
  const designSystemName = "@fixture/design-system";
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(path.join(target, "package.json"), `${JSON.stringify(packageFromContract("@fixture/ui", contract, { [designSystemName]: "workspace:*" }), null, 2)}\n`);
  writeRequiredFiles(target, contract.required_file_groups);
  fs.writeFileSync(path.join(target, "src", "main.tsx"), `import { createRoot } from "react-dom/client";\nimport { Artifact0 } from "${designSystemName}";\ncreateRoot(document.body).render(Artifact0());\n`);
  updateLock(runRoot, "apps/ui", contract, { [designSystemName]: "workspace:*" });
  if (evaluations) materializeEvaluations(context);
}

function materializeComplete(context, options) {
  materializeStructure(context);
  materializeTokens(context);
  materializeStyling(context);
  materializeApplication(context, options);
}

function begin(context, phase) {
  return beginFullApplicationPhase({ ...context, phase });
}

function verify(context, phase, runner = () => {}) {
  return verifyFullApplicationRun({
    ...context,
    phase,
    runner,
    hostVersion: context.profile.host.node_version
  });
}

function materializeVerifiedGeneration(context, { closeApplication = true } = {}) {
  begin(context, "structure");
  materializeStructure(context);
  verify(context, "structure");
  begin(context, "tokens");
  materializeTokens(context);
  verify(context, "tokens");
  begin(context, "styling");
  materializeStyling(context);
  verify(context, "styling");
  begin(context, "application");
  materializeApplication(context, { evaluations: false });
  if (closeApplication) verify(context, "application");
}

test("seeds byte-identical token-unrealized inputs and accepts either forwarded-argument form", (t) => {
  const context = prepareFixture(t);
  assert.deepEqual(fs.readdirSync(context.runRoot).sort(), ["ujg", "ujg-implementation.yaml"]);
  assert.ok(fs.readFileSync(path.join(context.runRoot, "ujg-implementation.yaml")).equals(fs.readFileSync(path.join(context.repoRoot, "ujg-implementation.yaml"))));
  assert.ok(fs.readFileSync(path.join(context.runRoot, "ujg", "workshop-registration.ujg.jsonld")).equals(fs.readFileSync(path.join(context.repoRoot, "ujg", "workshop-registration.ujg.jsonld"))));
  assert.equal(validateFullApplicationRun({ ...context, phase: "seed" }), context.runRoot);
  assert.deepEqual(normalizeForwardedArgs(["--", "run-a"]), ["run-a"]);
  assert.deepEqual(normalizeForwardedArgs(["run-a"]), ["run-a"]);
  assert.ok(relativeFiles(context.runRoot).every((file) => !file.startsWith("apps/") && !file.startsWith("design-system/")));
});

test("rejects unsafe names and existing targets", (t) => {
  const { repoRoot, runsRoot } = prepareFixture(t, "initial");
  for (const runName of ["../escape", "Uppercase", "two words", "-leading", "trailing-"]) {
    assert.throws(() => seedFullApplicationRun({ repoRoot, runsRoot, runName }), /Run name must be/);
  }
  assert.throws(() => seedFullApplicationRun({ repoRoot, runsRoot, runName: "initial" }), /Run already exists/);
});

test("profile parsing is strict and structure rejects missing dependencies and placeholder commands", (t) => {
  const context = prepareFixture(t);
  const profilePath = path.join(context.repoRoot, realizationProfileRelativePath);
  const original = fs.readFileSync(profilePath, "utf8");
  fs.writeFileSync(profilePath, original.replace("profile_version: 1", "profile_version: 1\nunknown: true"));
  assert.throws(() => loadRealizationProfile(context.repoRoot), /must contain exactly/);
  fs.writeFileSync(profilePath, original);

  begin(context, "structure");
  const target = materializeStructure(context);
  assert.equal(validateFullApplicationRun({ ...context, phase: "structure" }), context.runRoot);
  const packagePath = path.join(target, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  const dependency = Object.keys(context.profile.target_profiles.design_system.package.dependencies)[0];
  delete packageJson.dependencies[dependency];
  fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
  assert.throws(() => validateFullApplicationRun({ ...context, phase: "structure" }), /must declare/);
  packageJson.dependencies[dependency] = context.profile.target_profiles.design_system.package.dependencies[dependency];
  packageJson.scripts.build = "node scripts/placeholder.mjs";
  fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
  assert.throws(() => validateFullApplicationRun({ ...context, phase: "structure" }), /must invoke/);
  packageJson.scripts.build = scriptFor(context.profile.target_profiles.design_system.commands.build);
  fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
  const entryPath = path.join(target, context.profile.target_profiles.design_system.artifact_entry_files[0]);
  fs.appendFileSync(entryPath, "export {};\n");
  assert.throws(() => validateFullApplicationRun({ ...context, phase: "structure" }), /empty-build/);
});

test("token phase requires the profile Theme pair, semantic parity, and truthful evidence", (t) => {
  const context = prepareFixture(t);
  begin(context, "structure");
  materializeStructure(context);
  verify(context, "structure");
  begin(context, "tokens");
  materializeTokens(context);
  assert.equal(validateFullApplicationRun({ ...context, phase: "tokens" }), context.runRoot);

  const ujgPath = path.join(context.runRoot, "ujg", "workshop-registration.ujg.jsonld");
  const correct = fs.readFileSync(ujgPath, "utf8");
  const ujg = JSON.parse(correct);
  const removedTheme = context.profile.themes.names[1];
  const removedTokenPath = path.join(context.runRoot, "design", "tokens", `${removedTheme}.tokens.json`);
  const removedTokenSource = fs.readFileSync(removedTokenPath, "utf8");
  ujg.nodes = ujg.nodes.filter((node) => !String(node["@id"] ?? "").endsWith(`-${removedTheme}`));
  fs.writeFileSync(ujgPath, `${JSON.stringify(ujg, null, 2)}\n`);
  fs.rmSync(removedTokenPath);
  assert.throws(() => validateFullApplicationRun({ ...context, phase: "tokens" }), /Theme inventory|TokenSource inventory/);

  fs.writeFileSync(ujgPath, correct);
  fs.writeFileSync(removedTokenPath, removedTokenSource);
  materializeTokensFileEvidence(context, context.profile.themes.names[1], context.profile.themes.light_evidence);
  assert.throws(() => validateFullApplicationRun({ ...context, phase: "tokens" }), /evidence classification/);
  fs.writeFileSync(removedTokenPath, removedTokenSource);
  mutateFirstEvidencePath(context, context.profile.themes.names[1], "references/workshop-registration/screens/missing.png");
  assert.throws(() => validateFullApplicationRun({ ...context, phase: "tokens" }), /missing or out-of-scope/);
  fs.writeFileSync(removedTokenPath, removedTokenSource);
  const asymmetric = JSON.parse(removedTokenSource);
  delete asymmetric.semantic[context.profile.themes.required_semantic_roles[0]];
  fs.writeFileSync(removedTokenPath, `${JSON.stringify(asymmetric, null, 2)}\n`);
  assert.throws(() => validateFullApplicationRun({ ...context, phase: "tokens" }), /required role|inventories/);
});

function materializeTokensFileEvidence(context, themeName, classification) {
  const file = path.join(context.runRoot, "design", "tokens", `${themeName}.tokens.json`);
  const tokens = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const token of Object.values(tokens.semantic)) {
    token.$extensions[context.profile.themes.provenance_extension][context.profile.themes.provenance_classification_field] = classification;
  }
  fs.writeFileSync(file, `${JSON.stringify(tokens, null, 2)}\n`);
}

function mutateFirstEvidencePath(context, themeName, replacement) {
  const file = path.join(context.runRoot, "design", "tokens", `${themeName}.tokens.json`);
  const tokens = JSON.parse(fs.readFileSync(file, "utf8"));
  const token = Object.values(tokens.semantic)[0];
  token.$extensions[context.profile.themes.provenance_extension][context.profile.themes.provenance_paths_field] = [replacement];
  fs.writeFileSync(file, `${JSON.stringify(tokens, null, 2)}\n`);
}

test("complete phase rejects non-integrated browser source and missing evaluations", (t) => {
  const context = prepareFixture(t, "completed");
  materializeVerifiedGeneration(context);
  assert.throws(() => validateFullApplicationRun({ ...context, phase: "complete" }), /evaluation directory/);
  materializeEvaluations(context);
  const duplicateResult = JSON.parse(fs.readFileSync(path.join(canonicalRepoRoot, evaluationDefinitions[0].fixture), "utf8"));
  duplicateResult.run_id = context.runName;
  assert.throws(() => writeEvaluationResult(context.repoRoot, {
    runName: context.runName,
    phase: evaluationDefinitions[0].phase,
    evaluator: "Fixture",
    result: duplicateResult
  }), /EEXIST/);
  const evaluationPath = path.join(context.repoRoot, "checks", "evaluation", context.runName, "structure.fixture.json");
  const evaluationSource = fs.readFileSync(evaluationPath, "utf8");
  const malformed = JSON.parse(evaluationSource);
  malformed.quality_score_5 = 5;
  fs.writeFileSync(evaluationPath, `${JSON.stringify(malformed, null, 2)}\n`);
  assert.throws(() => validateFullApplicationRun({ ...context, phase: "complete" }), /arithmetic mean/);
  fs.writeFileSync(evaluationPath, evaluationSource);
  assert.throws(() => validateFullApplicationRun({ ...context, phase: "application" }), /not active/);

  const mainPath = path.join(context.runRoot, "apps", "ui", "src", "main.tsx");
  fs.writeFileSync(mainPath, "document.body.textContent = 'not integrated';\n");
  assert.throws(() => validateFullApplicationRun({ ...context, phase: "complete" }), /profile-selected interface runtime/);
});

test("executable verification dispatches commands from the profile and rejects persisted mappings", (t) => {
  const context = prepareFixture(t, "verified");
  begin(context, "structure");
  materializeStructure(context);
  verify(context, "structure");
  begin(context, "tokens");
  materializeTokens(context);
  verify(context, "tokens");
  begin(context, "styling");
  materializeStyling(context);
  verify(context, "styling");
  begin(context, "application");
  materializeApplication(context, { evaluations: false });
  const tasks = [];
  assert.throws(() => verifyFullApplicationRun({ ...context, phase: "application", runner: () => {}, hostVersion: "0" }), /Host Node version/);
  assert.equal(verifyFullApplicationRun({ ...context, phase: "application", runner: (task) => tasks.push(task), hostVersion: context.profile.host.node_version }), context.runRoot);
  materializeEvaluations(context);
  assert.equal(tasks[0].executable, context.profile.package_manager.name);
  for (const command of Object.values(context.profile.target_profiles.design_system.commands).filter((entry) => entry.phases.includes("application"))) {
    assert.ok(tasks.some((task) => task.args.includes(command.executable)));
  }
  const manifest = YAML.parse(fs.readFileSync(path.join(context.runRoot, "ujg-implementation.yaml"), "utf8"));
  manifest.domain_engine.runtime.environment = "unsupported-runtime";
  assert.throws(() => buildVerificationTasks({
    runRoot: context.runRoot,
    manifest,
    profile: context.profile,
    phase: "application",
    temporaryOutput: path.join(os.tmpdir(), "unused-output")
  }), /No executable verifier profile supports/);

  const projection = path.join(context.runRoot, "apps", "ui", "transition-map.json");
  fs.writeFileSync(projection, "{}\n");
  assert.throws(() => validateFullApplicationRun({ ...context, phase: "complete" }), /Prohibited generated projection/);
});

test("generation phases open and close in order without evaluation gates", (t) => {
  const context = prepareFixture(t, "ordered");
  assert.throws(() => begin(context, "tokens"), /Next permitted phase is structure/);
  begin(context, "structure");
  assert.equal(begin(context, "structure"), context.runRoot);
  assert.throws(() => begin(context, "tokens"), /still active/);
  materializeStructure(context);
  assert.throws(() => verify(context, "structure", () => { throw new Error("compiler failed"); }), /compiler failed/);
  assert.equal(readPhaseState(context.runRoot, context.runName).active_phase, "structure");
  assert.throws(() => begin(context, "tokens"), /still active/);
  verify(context, "structure");
  assert.equal(readPhaseState(context.runRoot, context.runName).active_phase, null);
  assert.deepEqual(readPhaseState(context.runRoot, context.runName).completed_phases, ["structure"]);
  begin(context, "tokens");
});

test("generation rejects evaluation output before application verification closes", (t) => {
  const context = prepareFixture(t, "early-evaluation");
  begin(context, "structure");
  materializeStructure(context);
  assert.throws(() => materializeEvaluations(context), /four generation phases/);
  const evaluationDirectory = path.join(context.repoRoot, "checks", "evaluation", context.runName);
  fs.mkdirSync(evaluationDirectory, { recursive: true });
  fs.writeFileSync(path.join(evaluationDirectory, "structure.early.json"), "{}\n");
  assert.throws(() => validateFullApplicationRun({ ...context, phase: "structure" }), /only after all four generation phases/);
  assert.throws(() => verify(context, "structure"), /only after all four generation phases/);
  assert.equal(readPhaseState(context.runRoot, context.runName).active_phase, "structure");
});

test("current phase rejects artifacts belonging to future invocations", (t) => {
  const context = prepareFixture(t, "combined");
  begin(context, "structure");
  materializeComplete(context, { evaluations: false });
  assert.throws(() => validateFullApplicationRun({ ...context, phase: "structure" }), /Theme|future token|future application/);
});

test("application closes before post-generation evaluations and complete requires all four", (t) => {
  const context = prepareFixture(t, "post-evaluation");
  materializeVerifiedGeneration(context, { closeApplication: false });
  assert.throws(() => requireGenerationComplete({ runRoot: context.runRoot, runName: context.runName }), /four generation phases/);
  assert.throws(() => validatePostGenerationEvaluation(context.repoRoot, context.runName, "structure"), /four generation phases/);
  assert.equal(validateFullApplicationRun({ ...context, phase: "application" }), context.runRoot);
  verify(context, "application");
  assert.equal(requireGenerationComplete({ runRoot: context.runRoot, runName: context.runName }).active_phase, null);
  assert.throws(() => validateFullApplicationRun({ ...context, phase: "complete" }), /evaluation directory/);
  materializeEvaluations(context);
  assert.equal(validatePostGenerationEvaluation(context.repoRoot, context.runName, "structure").length, 1);
  assert.equal(validateFullApplicationRun({ ...context, phase: "complete" }), context.runRoot);
});
