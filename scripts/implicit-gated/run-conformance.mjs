import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { validateCompletedRunEvaluations } from "./evaluation-results.mjs";

const applicationPhases = new Set(["application", "complete"]);
const tokenPhases = new Set(["tokens", "styling", "application", "complete"]);
const stylingPhases = new Set(["styling", "application", "complete"]);
const sourceExtensions = new Set([".css", ".js", ".jsx", ".mjs", ".mts", ".ts", ".tsx"]);

function fail(message) {
  throw new Error(message);
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readJson(filePath, label = filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
  }
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "dist", "storybook-static", ".git", ".data"].includes(entry.name)) return [];
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(target) : [target];
  });
}

function resolveBelow(root, relative, label) {
  if (typeof relative !== "string" || relative.length === 0 || path.isAbsolute(relative)) {
    fail(`${label} must be a local relative path.`);
  }
  const target = path.resolve(root, relative);
  const fromRoot = path.relative(root, target);
  if (fromRoot === "" || fromRoot.startsWith("..") || path.isAbsolute(fromRoot)) {
    fail(`${label} must resolve below ${root}.`);
  }
  return target;
}

function selectedDesignSystems(manifest) {
  return [...new Set((manifest.interfaces ?? []).flatMap((entry) =>
    Array.isArray(entry.design_systems) ? entry.design_systems : []
  ))];
}

function validateWorkspace(runRoot, profile) {
  const packageJson = readJson(path.join(runRoot, "package.json"), "run package.json");
  const selectedManager = `${profile.package_manager.name}@${profile.package_manager.version}`;
  if (packageJson.packageManager !== selectedManager) fail(`Run packageManager must match the realization profile.`);
  if (typeof packageJson.engines?.node !== "string" || !packageJson.engines.node.includes(profile.host.node_version)) {
    fail("Run Node engine does not match the realization profile.");
  }
  if (!fs.statSync(path.join(runRoot, profile.package_manager.workspace_file), { throwIfNoEntry: false })?.isFile()) {
    fail(`Run is missing ${profile.package_manager.workspace_file}.`);
  }
}

function commandNeedle(command) {
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

function validatePackageContract(target, contract, profile, runRoot, label) {
  const packagePath = path.join(target, "package.json");
  const packageJson = readJson(packagePath, `${label}/package.json`);
  for (const [profileKey, packageKey] of [["dependencies", "dependencies"], ["dev_dependencies", "devDependencies"]]) {
    const actual = packageJson[packageKey] ?? {};
    for (const [name, version] of Object.entries(contract.package[profileKey])) {
      if (actual[name] !== version) fail(`${label} must declare ${name} at the profile-selected version.`);
    }
  }

  if (!isObject(packageJson.scripts)) fail(`${label} must declare package scripts.`);
  for (const [name, command] of Object.entries(contract.commands)) {
    const script = packageJson.scripts[name];
    if (typeof script !== "string" || !script.includes(commandNeedle(command))) {
      fail(`${label} script ${name} must invoke the profile-selected executable and arguments.`);
    }
    const normalized = script.toLowerCase();
    if (profile.prohibited.script_fragments.some((fragment) => normalized.includes(fragment.toLowerCase()))) {
      fail(`${label} script ${name} contains a prohibited placeholder form.`);
    }
  }

  for (const alternatives of contract.required_file_groups) {
    if (!alternatives.some((relative) => fs.statSync(path.join(target, relative), { throwIfNoEntry: false })?.isFile())) {
      fail(`${label} is missing one required file alternative: ${alternatives.join(" or ")}.`);
    }
  }

  const files = walkFiles(target);
  for (const fragment of profile.prohibited.implementation_file_fragments) {
    if (files.some((file) => path.basename(file).toLowerCase().includes(fragment.toLowerCase()))) {
      fail(`${label} contains prohibited placeholder implementation ${fragment}.`);
    }
  }
  const implementationSource = files
    .filter((file) => sourceExtensions.has(path.extname(file)))
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");
  for (const fragment of profile.prohibited.empty_build_fragments) {
    if (implementationSource.replace(/\s+/g, "").includes(fragment.replace(/\s+/g, ""))) {
      fail(`${label} contains a prohibited empty-build form.`);
    }
  }

  const lockPath = path.join(runRoot, profile.package_manager.lockfile);
  if (!fs.existsSync(lockPath)) fail(`Run is missing ${profile.package_manager.lockfile}.`);
  let lock;
  try {
    lock = YAML.parse(fs.readFileSync(lockPath, "utf8"));
  } catch (error) {
    fail(`${profile.package_manager.lockfile} is invalid: ${error.message}`);
  }
  const importerKey = path.relative(runRoot, target).split(path.sep).join("/") || ".";
  const importer = lock?.importers?.[importerKey];
  if (!isObject(importer)) fail(`${profile.package_manager.lockfile} has no importer for ${label}.`);
  for (const [profileKey, lockKey] of [["dependencies", "dependencies"], ["dev_dependencies", "devDependencies"]]) {
    for (const [name, version] of Object.entries(contract.package[profileKey])) {
      const entry = importer[lockKey]?.[name];
      const specifier = typeof entry === "string" ? entry : entry?.specifier;
      if (specifier !== version) fail(`${profile.package_manager.lockfile} does not pin ${label} dependency ${name}.`);
    }
  }
  return packageJson;
}

function validateBindingModules(designSystem, label, contract) {
  const bindingPath = path.join(designSystem, "generated", "ds-bindings.manifest.json");
  const binding = readJson(bindingPath, `${label} bindings`);
  const entryPath = contract.artifact_entry_files
    .map((relative) => path.join(designSystem, relative))
    .find((candidate) => fs.statSync(candidate, { throwIfNoEntry: false })?.isFile());
  if (!entryPath) fail(`${label} has no profile-selected artifact entry module.`);
  const entrySource = fs.readFileSync(entryPath, "utf8");
  for (const artifact of binding.artifacts ?? []) {
    const expectedDirectory = artifact.type === "Template" ? "templates/" : "components/";
    if (!artifact.module.replace(/^\.\//, "").startsWith(expectedDirectory)) {
      fail(`${label} binding module is outside its ${artifact.type} directory: ${artifact.module}.`);
    }
    const modulePath = resolveBelow(designSystem, artifact.module, `${label} binding module`);
    if (!fs.statSync(modulePath, { throwIfNoEntry: false })?.isFile()) {
      fail(`${label} binding module does not exist: ${artifact.module}.`);
    }
    const source = fs.readFileSync(modulePath, "utf8");
    for (const pattern of contract.source_requirements.artifact_forbidden_patterns) {
      if (new RegExp(pattern).test(source)) fail(`${label} binding module contains a profile-prohibited placeholder form.`);
    }
    const escaped = artifact.export.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`export\\s+(?:function|class|const|let|var)\\s+${escaped}\\b`).test(source)) {
      fail(`${label} binding export is not authored by ${artifact.module}: ${artifact.export}.`);
    }
    const extension = path.extname(modulePath);
    const storyPath = modulePath.slice(0, -extension.length) + `.stories${extension}`;
    if (!fs.statSync(storyPath, { throwIfNoEntry: false })?.isFile()) {
      fail(`${label} binding has no colocated story: ${artifact.module}.`);
    }
    if (!fs.readFileSync(storyPath, "utf8").includes(artifact.export)) {
      fail(`${label} story does not render its bound export: ${artifact.export}.`);
    }
    if (!entrySource.includes(artifact.export)) {
      fail(`${label} artifact entry does not export ${artifact.export}.`);
    }
  }
  const tests = walkFiles(designSystem).filter((file) => /\.test\.[cm]?[jt]sx?$/.test(file));
  if (tests.length === 0) fail(`${label} has no executable source tests.`);
  const testSource = tests.map((file) => fs.readFileSync(file, "utf8")).join("\n");
  if (!(binding.artifacts ?? []).some((artifact) => testSource.includes(artifact.export))) {
    fail(`${label} tests do not exercise any bound artifact.`);
  }
  for (const pattern of contract.source_requirements.test_required_patterns) {
    if (!new RegExp(pattern).test(testSource)) fail(`${label} tests do not satisfy the profile's interaction-test contract.`);
  }
}

function collectTokens(node, prefix = [], inheritedType, inheritedExtension, output = []) {
  if (!isObject(node)) return output;
  const type = node.$type ?? inheritedType;
  const extension = node.$extensions ?? inheritedExtension;
  if (Object.hasOwn(node, "$value")) {
    output.push({ path: prefix.join("."), type, value: node.$value, extension });
    return output;
  }
  for (const [key, child] of Object.entries(node)) {
    if (!key.startsWith("$")) collectTokens(child, [...prefix, key], type, extension, output);
  }
  return output;
}

function validateTypedValue(token, label) {
  if (typeof token.type !== "string" || token.type.length === 0) fail(`${label}.${token.path} has no DTCG type.`);
  if (typeof token.value === "string" && /^\{[^{}]+\}$/.test(token.value)) return;
  if (token.type === "color" && (!isObject(token.value) || typeof token.value.colorSpace !== "string" || !Array.isArray(token.value.components))) {
    fail(`${label}.${token.path} is not a DTCG color value.`);
  }
  if (token.type === "dimension" && (!isObject(token.value) || typeof token.value.value !== "number" || typeof token.value.unit !== "string")) {
    fail(`${label}.${token.path} is not a DTCG dimension value.`);
  }
  if (token.type === "number" && typeof token.value !== "number") fail(`${label}.${token.path} is not a number.`);
}

function validateAliasGraph(tokens, label) {
  const byPath = new Map(tokens.map((token) => [token.path, token]));
  const resolve = (token, active = new Set()) => {
    if (!(typeof token.value === "string" && /^\{[^{}]+\}$/.test(token.value))) return token.value;
    const ref = token.value.slice(1, -1);
    if (active.has(ref)) fail(`${label} contains an alias cycle at ${ref}.`);
    const target = byPath.get(ref);
    if (!target) fail(`${label}.${token.path} has unresolved alias ${token.value}.`);
    return resolve(target, new Set([...active, ref]));
  };
  return new Map(tokens.map((token) => [token.path, resolve(token)]));
}

function themeName(theme, names) {
  const identity = `${theme["@id"] ?? ""} ${theme.label ?? ""}`.toLowerCase();
  const matches = names.filter((name) => new RegExp(`(^|[^a-z0-9])${name}([^a-z0-9]|$)`, "i").test(identity));
  if (matches.length !== 1) fail(`Theme ${theme["@id"]} must identify exactly one profile Theme name.`);
  return matches[0];
}

function validateEvidence(tokens, expectedClassification, profile, repoRoot, label) {
  let classified = 0;
  for (const token of tokens) {
    const evidence = token.extension?.[profile.themes.provenance_extension];
    if (!evidence) fail(`${label}.${token.path} has no token provenance.`);
    const classification = evidence[profile.themes.provenance_classification_field];
    if (classification !== expectedClassification) {
      fail(`${label}.${token.path} must use ${expectedClassification} evidence classification.`);
    }
    classified += 1;
    const paths = evidence[profile.themes.provenance_paths_field] ?? [];
    if (!Array.isArray(paths) || paths.length === 0) fail(`${label}.${token.path} has invalid evidence paths.`);
    for (const relative of paths) {
      const expectedRoot = path.resolve(repoRoot, profile.themes.evidence_root);
      const target = path.resolve(repoRoot, relative);
      const fromRoot = path.relative(expectedRoot, target);
      if (fromRoot.startsWith("..") || path.isAbsolute(fromRoot) || !fs.statSync(target, { throwIfNoEntry: false })?.isFile()) {
        fail(`${label}.${token.path} references missing or out-of-scope visual evidence ${relative}.`);
      }
    }
  }
  if (classified === 0) fail(`${label} has no ${expectedClassification} token provenance.`);
}

function validateThemes(ujg, runUjgPath, runRoot, repoRoot, profile) {
  const sources = new Map((ujg.nodes ?? []).filter((node) => node?.["@type"] === "TokenSource").map((node) => [node["@id"], node]));
  const themes = (ujg.nodes ?? []).filter((node) => node?.["@type"] === "Theme");
  if (themes.length !== profile.themes.names.length) fail("Run does not contain the profile-required Theme inventory.");

  const byName = new Map();
  for (const theme of themes) {
    const name = themeName(theme, profile.themes.names);
    if (byName.has(name)) fail(`Run contains duplicate ${name} Themes.`);
    byName.set(name, theme);
  }
  const refSets = [...byName.values()].map((theme) => new Set(theme.tokenSourceRefs));
  const shared = [...refSets[0]].filter((ref) => refSets.every((set) => set.has(ref)));
  if (shared.length !== profile.themes.shared_source_count) fail("Theme shared TokenSource topology does not match the realization profile.");
  const expectedSourceCount = profile.themes.shared_source_count +
    profile.themes.names.length * profile.themes.unique_source_count_per_theme;
  if (sources.size !== expectedSourceCount) fail("TokenSource inventory does not match the realization profile.");

  const sourceTokens = new Map();
  for (const [ref, source] of sources) {
    const sourcePath = path.resolve(path.dirname(runUjgPath), source.source);
    const tokens = collectTokens(readJson(sourcePath, source.source));
    if (tokens.length === 0) fail(`${source.source} contains no DTCG tokens.`);
    tokens.forEach((token) => validateTypedValue(token, source.source));
    sourceTokens.set(ref, tokens);
  }

  const semanticByName = new Map();
  for (const [name, theme] of byName) {
    const uniqueRefs = theme.tokenSourceRefs.filter((ref) => !shared.includes(ref));
    if (uniqueRefs.length !== profile.themes.unique_source_count_per_theme) {
      fail(`${name} Theme has the wrong number of unique semantic TokenSources.`);
    }
    const orderedTokens = theme.tokenSourceRefs.flatMap((ref) => sourceTokens.get(ref) ?? []);
    const resolved = validateAliasGraph(orderedTokens, `${name} Theme`);
    const semanticTokens = uniqueRefs.flatMap((ref) => sourceTokens.get(ref) ?? []);
    const paths = new Set(semanticTokens.map((token) => token.path));
    for (const role of profile.themes.required_semantic_roles) {
      if (![...paths].some((tokenPath) => tokenPath.toLowerCase().includes(role.toLowerCase()))) {
        fail(`${name} Theme has no semantic token for required role ${role}.`);
      }
    }
    semanticByName.set(name, { paths, resolved, tokens: semanticTokens });
  }

  if (profile.themes.require_semantic_role_parity) {
    const inventories = [...semanticByName.values()].map(({ paths }) => JSON.stringify([...paths].sort()));
    if (new Set(inventories).size !== 1) fail("Theme semantic token inventories are not identical.");
  }
  if (profile.themes.require_distinct_semantic_values) {
    const entries = [...semanticByName.values()];
    const commonPaths = [...entries[0].paths].filter((tokenPath) => entries.every(({ paths }) => paths.has(tokenPath)));
    if (!commonPaths.some((tokenPath) => JSON.stringify(entries[0].resolved.get(tokenPath)) !== JSON.stringify(entries[1].resolved.get(tokenPath)))) {
      fail("Theme semantic values are not distinguishable.");
    }
  }

  const [lightName, darkName] = profile.themes.names;
  validateEvidence(semanticByName.get(lightName).tokens, profile.themes.light_evidence, profile, repoRoot, `${lightName} Theme`);
  validateEvidence(semanticByName.get(darkName).tokens, profile.themes.dark_evidence, profile, repoRoot, `${darkName} Theme`);
}

function requirePatterns(source, patterns, message) {
  for (const pattern of patterns) {
    if (!new RegExp(pattern).test(source)) fail(message);
  }
}

function validateStyling(designSystem, label, contract) {
  const files = walkFiles(designSystem);
  const sources = files
    .filter((file) => sourceExtensions.has(path.extname(file)))
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");
  const css = files.filter((file) => file.endsWith(".css")).map((file) => fs.readFileSync(file, "utf8")).join("\n");
  const vite = files.filter((file) => /vite\.config\.[cm]?[jt]s$/.test(file)).map((file) => fs.readFileSync(file, "utf8")).join("\n");
  const preview = files.filter((file) => /\.storybook\/preview\.[cm]?[jt]s$/.test(file.split(path.sep).join("/"))).map((file) => fs.readFileSync(file, "utf8")).join("\n");
  const requirements = contract.source_requirements;
  requirePatterns(css, requirements.css_required_patterns, `${label} has no profile-conformant styling entry.`);
  requirePatterns(vite, requirements.build_config_required_patterns, `${label} does not configure the profile-selected styling integration.`);
  requirePatterns(preview, requirements.inspection_required_patterns, `${label} inspection configuration is incomplete.`);
  requirePatterns(sources, requirements.resolver_required_patterns, `${label} does not implement the UJG-driven token resolver pipeline.`);
}

function validateBrowserTarget(entry, runRoot, profile, designSystemPackages) {
  const target = resolveBelow(runRoot, entry.target, "browser interface target");
  const label = `browser interface ${entry.target}`;
  const packageJson = validatePackageContract(target, profile.target_profiles.browser_interface, profile, runRoot, label);
  const source = walkFiles(path.join(target, "src"))
    .filter((file) => sourceExtensions.has(path.extname(file)))
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");
  requirePatterns(source, profile.target_profiles.browser_interface.source_requirements.required_patterns, `${label} does not implement its profile-selected interface runtime.`);
  for (const selected of entry.design_systems ?? []) {
    const packageName = designSystemPackages.get(selected);
    if (!packageName || typeof packageJson.dependencies?.[packageName] !== "string" || !source.includes(packageName)) {
      fail(`${label} does not depend on and import selected design system ${selected}.`);
    }
    const lock = YAML.parse(fs.readFileSync(path.join(runRoot, profile.package_manager.lockfile), "utf8"));
    const importerKey = path.relative(runRoot, target).split(path.sep).join("/");
    if (!lock.importers?.[importerKey]?.dependencies?.[packageName]) {
      fail(`${profile.package_manager.lockfile} does not link ${label} to selected design system ${selected}.`);
    }
  }
}

export function validateProfileConformance({ repoRoot, runRoot, runName, phase, manifest, ujg, runUjgPath, profile, requireEvaluations = true }) {
  if (phase === "seed") return;
  validateWorkspace(runRoot, profile);
  const designSystemContract = profile.target_profiles.design_system;
  const designSystemPackages = new Map();
  for (const selected of selectedDesignSystems(manifest)) {
    const target = resolveBelow(runRoot, selected, "selected design system");
    if (!fs.statSync(target, { throwIfNoEntry: false })?.isDirectory()) fail(`Missing selected design system: ${selected}.`);
    const packageJson = validatePackageContract(target, designSystemContract, profile, runRoot, `design system ${selected}`);
    if (typeof packageJson.name !== "string" || packageJson.name.length === 0) fail(`design system ${selected} has no package name.`);
    designSystemPackages.set(selected, packageJson.name);
    validateBindingModules(target, `design system ${selected}`, designSystemContract);
    if (stylingPhases.has(phase)) validateStyling(target, `design system ${selected}`, designSystemContract);
  }

  if (tokenPhases.has(phase)) validateThemes(ujg, runUjgPath, runRoot, repoRoot, profile);
  else if ((ujg.nodes ?? []).some((node) => ["Theme", "TokenSource"].includes(node?.["@type"]))) {
    fail("Structure phase must remain token-unrealized.");
  }

  if (applicationPhases.has(phase)) {
    const browserKinds = new Set(profile.target_profiles.browser_interface.interface_kinds);
    for (const entry of manifest.interfaces ?? []) {
      if (browserKinds.has(entry.kind)) validateBrowserTarget(entry, runRoot, profile, designSystemPackages);
    }
    if (requireEvaluations) validateCompletedRunEvaluations(repoRoot, runName);
  }
}
