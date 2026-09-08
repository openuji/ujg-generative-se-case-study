import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { assertNoRunEvaluations } from "./evaluation-results.mjs";
import { loadRealizationProfile } from "./realization-profile.mjs";
import { validateProfileConformance } from "./run-conformance.mjs";
import { beginPhase, phaseStateFile, requireActivePhase, requireGenerationComplete, validationPhases } from "./phase-state.mjs";

const runNamePattern = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const generatedTokenNodeTypes = new Set(["Theme", "TokenSource"]);
const ignoredDirectoryNames = new Set([
  ".git",
  ".data",
  ".vite",
  "coverage",
  "dist",
  "node_modules",
  "playwright-report",
  "storybook-static",
  "test-results"
]);
const textExtensions = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsonld",
  ".jsx",
  ".md",
  ".mjs",
  ".mts",
  ".scss",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml"
]);

function fail(message) {
  throw new Error(message);
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertRunName(runName) {
  if (!runNamePattern.test(runName)) {
    fail("Run name must be 1-64 lowercase letters, digits, or hyphens; it must start and end with a letter or digit.");
  }
}

function assertInside(root, target, label) {
  const relative = path.relative(root, target);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(`${label} must resolve below ${root}.`);
  }
  return target;
}

function resolveInside(root, value, label) {
  if (typeof value !== "string" || value.length === 0 || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)) {
    fail(`${label} must be a non-empty local relative path.`);
  }
  return assertInside(root, path.resolve(root, value), label);
}

function readJson(filePath, label = filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
  }
}

function schemaSources(ujg) {
  return (ujg.nodes ?? [])
    .filter((node) => node?.["@type"] === "DataSchema")
    .map((node) => node.dataSchemaSource);
}

function unique(values) {
  return [...new Set(values)];
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignoredDirectoryNames.has(entry.name)) return [];
    const entryPath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) fail(`Run workspaces may not contain symbolic links: ${entryPath}`);
    return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
  });
}

function compareFile(source, target, label) {
  if (!fs.existsSync(target)) fail(`Missing ${label}: ${target}`);
  if (!fs.readFileSync(source).equals(fs.readFileSync(target))) {
    fail(`${label} is not byte-identical to the canonical input.`);
  }
}

function withoutGeneratedTokenNodes(ujg) {
  return {
    ...ujg,
    nodes: (ujg.nodes ?? []).filter((node) => !generatedTokenNodeTypes.has(node?.["@type"]))
  };
}

function validateUjgBaseIntegrity(canonicalUjg, runUjg) {
  const canonicalBase = JSON.stringify(withoutGeneratedTokenNodes(canonicalUjg));
  const runBase = JSON.stringify(withoutGeneratedTokenNodes(runUjg));
  if (runBase !== canonicalBase) {
    fail("Run UJG changed outside the token phase's Theme/TokenSource enrichment boundary.");
  }
}

function visitObjects(value, visitor) {
  if (Array.isArray(value)) {
    for (const item of value) visitObjects(item, visitor);
    return;
  }
  if (!isObject(value)) return;
  visitor(value);
  for (const child of Object.values(value)) visitObjects(child, visitor);
}

function validateUjgReferences(ujg) {
  const identifiers = new Set();
  visitObjects(ujg, (object) => {
    for (const key of ["@id", "id"]) {
      const identifier = object[key];
      if (typeof identifier === "string" && identifier.startsWith("urn:")) {
        if (identifiers.has(identifier)) fail(`Duplicate UJG identifier: ${identifier}`);
        identifiers.add(identifier);
      }
    }
  });

  visitObjects(ujg, (object) => {
    for (const [key, value] of Object.entries(object)) {
      const refs = key.endsWith("Refs") && Array.isArray(value)
        ? value
        : key.endsWith("Ref") && typeof value === "string"
          ? [value]
          : [];
      for (const ref of refs) {
        if (typeof ref === "string" && ref.startsWith("urn:") && !identifiers.has(ref)) {
          fail(`Unresolved UJG reference ${key}: ${ref}`);
        }
      }
    }
  });
}

function isApplicationPhase(phase) {
  return phase === "application" || phase === "complete";
}

function validateManifest(manifest, ujg, runRoot, phase) {
  if (!isObject(manifest) || !Number.isInteger(manifest.manifest_version) || typeof manifest.ujg !== "string") {
    fail("Run manifest must declare an integer manifest_version and a UJG path.");
  }

  const manifestUjgPath = resolveInside(runRoot, manifest.ujg, "manifest.ujg");
  if (!fs.existsSync(manifestUjgPath)) fail(`Manifest UJG does not exist: ${manifest.ujg}`);

  const touchpointIds = new Set(
    (ujg.nodes ?? []).filter((node) => node?.["@type"] === "Touchpoint").map((node) => node["@id"])
  );
  const assignedTouchpoints = new Set();
  const interfaces = manifest.interfaces ?? [];
  if (!Array.isArray(interfaces)) fail("manifest.interfaces must be an array when present.");

  for (const [index, entry] of interfaces.entries()) {
    if (!isObject(entry)) fail(`interfaces[${index}] must be an object.`);
    if (typeof entry.touchpoint_ref !== "string" || !touchpointIds.has(entry.touchpoint_ref)) {
      fail(`interfaces[${index}].touchpoint_ref must resolve to a UJG Touchpoint.`);
    }
    if (assignedTouchpoints.has(entry.touchpoint_ref)) {
      fail(`Touchpoint is assigned more than once: ${entry.touchpoint_ref}`);
    }
    assignedTouchpoints.add(entry.touchpoint_ref);
    if (typeof entry.kind !== "string" || entry.kind.length === 0) {
      fail(`interfaces[${index}].kind must be a non-empty string.`);
    }
    if (typeof entry.interaction_state_owner !== "string" || entry.interaction_state_owner.length === 0) {
      fail(`interfaces[${index}].interaction_state_owner must be a non-empty string.`);
    }

    if (entry.target !== undefined) {
      const target = resolveInside(runRoot, entry.target, `interfaces[${index}].target`);
      if (isApplicationPhase(phase) && !fs.existsSync(target)) fail(`Missing selected interface target: ${entry.target}`);
    }

    if (entry.design_systems !== undefined) {
      if (!Array.isArray(entry.design_systems)) fail(`interfaces[${index}].design_systems must be an array.`);
      for (const [designIndex, designSystem] of entry.design_systems.entries()) {
        const target = resolveInside(runRoot, designSystem, `interfaces[${index}].design_systems[${designIndex}]`);
        if (phase !== "seed" && fs.existsSync(runRoot) && !fs.existsSync(target)) fail(`Missing selected design system: ${designSystem}`);
      }
    }

    if (entry.transport !== undefined) {
      if (!isObject(entry.transport)) fail(`interfaces[${index}].transport must be an object.`);
      if (typeof entry.transport.protocol !== "string" || entry.transport.protocol.length === 0) {
        fail(`interfaces[${index}].transport.protocol must be a non-empty string.`);
      }
      if (entry.transport.documentation !== undefined) {
        if (!isObject(entry.transport.documentation)) {
          fail(`interfaces[${index}].transport.documentation must be an object.`);
        }
        if (typeof entry.transport.documentation.format !== "string" || entry.transport.documentation.format.length === 0) {
          fail(`interfaces[${index}].transport.documentation.format must be a non-empty string.`);
        }
        if (entry.transport.documentation.output !== undefined) {
          const output = resolveInside(runRoot, entry.transport.documentation.output, `interfaces[${index}].transport.documentation.output`);
          if (isApplicationPhase(phase) && !fs.existsSync(output)) {
            fail(`Missing requested interface documentation: ${entry.transport.documentation.output}`);
          }
        }
      }
    }

    if (entry.delivery !== undefined) {
      if (!isObject(entry.delivery)) fail(`interfaces[${index}].delivery must be an object.`);
      if (typeof entry.delivery.adapter !== "string" || entry.delivery.adapter.length === 0) {
        fail(`interfaces[${index}].delivery.adapter must be a non-empty string.`);
      }
    }
  }

  for (const touchpointId of touchpointIds) {
    if (!assignedTouchpoints.has(touchpointId)) fail(`UJG Touchpoint has no manifest interface: ${touchpointId}`);
  }

  if (manifest.domain_engine?.target !== undefined) {
    const target = resolveInside(runRoot, manifest.domain_engine.target, "domain_engine.target");
    if (isApplicationPhase(phase) && !fs.existsSync(target)) fail(`Missing selected domain-engine target: ${manifest.domain_engine.target}`);
    if (!isObject(manifest.domain_engine.runtime)) fail("domain_engine.runtime must be an object.");
    for (const field of ["environment", "version", "entrypoint"]) {
      if (typeof manifest.domain_engine.runtime[field] !== "string" || manifest.domain_engine.runtime[field].length === 0) {
        fail(`domain_engine.runtime.${field} must be a non-empty string.`);
      }
    }
    const entrypoint = resolveInside(target, manifest.domain_engine.runtime.entrypoint, "domain_engine.runtime.entrypoint");
    if (isApplicationPhase(phase) && !fs.existsSync(entrypoint)) {
      fail(`Missing selected domain-engine entrypoint: ${manifest.domain_engine.runtime.entrypoint}`);
    }
  }

  if (manifest.adapters !== undefined && !isObject(manifest.adapters)) {
    fail("manifest.adapters must be an object when present.");
  }
}

function selectedTargets(manifest, runRoot, selector) {
  return (manifest.interfaces ?? [])
    .map(selector)
    .filter((value) => typeof value === "string")
    .map((value) => resolveInside(runRoot, value, "manifest-selected target"));
}

function validateNoArtifactStyling(manifest, runRoot) {
  const designSystems = unique((manifest.interfaces ?? []).flatMap((entry) => entry.design_systems ?? []));
  for (const selected of designSystems) {
    const target = resolveInside(runRoot, selected, "selected design system");
    const binding = readJson(path.join(target, "generated", "ds-bindings.manifest.json"), "design-system bindings");
    for (const artifact of binding.artifacts ?? []) {
      const modulePath = resolveInside(target, artifact.module, "binding module");
      if (fs.existsSync(modulePath) && /\b(?:className|style)\s*=/.test(fs.readFileSync(modulePath, "utf8"))) {
        fail(`Phase contains future component styling: ${path.relative(runRoot, modulePath)}`);
      }
      for (const filePath of walkFiles(path.dirname(modulePath))) {
        if ([".css", ".scss"].includes(path.extname(filePath))) {
          fail(`Phase contains future component styling: ${path.relative(runRoot, filePath)}`);
        }
      }
    }
  }
}

function validatePhaseBoundaries(manifest, runRoot, phase) {
  if (phase === "complete" || phase === "application") return;
  const futureTargets = selectedTargets(manifest, runRoot, (entry) => entry.target);
  if (typeof manifest.domain_engine?.target === "string") {
    futureTargets.push(resolveInside(runRoot, manifest.domain_engine.target, "domain_engine.target"));
  }
  for (const target of futureTargets) {
    if (fs.existsSync(target)) fail(`Phase ${phase} contains a future application target: ${path.relative(runRoot, target)}`);
  }
  if (phase === "structure" && fs.existsSync(path.join(runRoot, "design", "tokens"))) {
    fail("Structure phase contains future token artifacts.");
  }
  if (phase === "structure" || phase === "tokens") validateNoArtifactStyling(manifest, runRoot);
}

function validateTokenSources(ujg, runUjgPath, runRoot, phase) {
  const tokenSources = new Map(
    (ujg.nodes ?? []).filter((node) => node?.["@type"] === "TokenSource").map((node) => [node["@id"], node])
  );
  const themes = (ujg.nodes ?? []).filter((node) => node?.["@type"] === "Theme");

  if (phase === "seed" || phase === "structure") {
    if (tokenSources.size > 0 || themes.length > 0) {
      fail("A seeded run must not contain generated Theme or TokenSource nodes.");
    }
    return;
  }

  if (tokenSources.size === 0 || themes.length === 0) {
    fail("A completed run must contain token-phase-generated Theme and TokenSource nodes.");
  }

  const tokenDirectory = path.join(runRoot, "design", "tokens");
  const referencedSources = new Set();
  const sourceTargets = new Set();
  for (const source of tokenSources.values()) {
    if (typeof source["@id"] !== "string" || source["@id"].length === 0) {
      fail("Every generated TokenSource must have a non-empty @id.");
    }
    const keys = Object.keys(source);
    if (keys.some((key) => !new Set(["@type", "@id", "label", "source"]).has(key))) {
      fail(`TokenSource ${source["@id"]} contains unsupported fields.`);
    }
    if (typeof source.source !== "string" || source.source.length === 0 || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(source.source)) {
      fail(`TokenSource ${source["@id"]}.source must be a non-empty local relative path.`);
    }
    const target = path.resolve(path.dirname(runUjgPath), source.source);
    assertInside(runRoot, target, `TokenSource ${source["@id"]}.source`);
    assertInside(tokenDirectory, target, `TokenSource ${source["@id"]}.source`);
    if (!target.endsWith(".tokens.json")) {
      fail(`TokenSource ${source["@id"]}.source must identify a DTCG .tokens.json file.`);
    }
    if (sourceTargets.has(target)) fail(`Generated TokenSources repeat the same source: ${source.source}`);
    sourceTargets.add(target);
    if (!fs.existsSync(target)) fail(`Missing token source: ${source.source}`);
    readJson(target, `TokenSource ${source["@id"]}.source`);
  }
  for (const theme of themes) {
    if (typeof theme["@id"] !== "string" || theme["@id"].length === 0) {
      fail("Every generated Theme must have a non-empty @id.");
    }
    const keys = Object.keys(theme);
    if (keys.some((key) => !new Set(["@type", "@id", "label", "tokenSourceRefs"]).has(key))) {
      fail(`Theme ${theme["@id"]} contains unsupported fields.`);
    }
    if (!Array.isArray(theme.tokenSourceRefs) || theme.tokenSourceRefs.length === 0) {
      fail(`Theme ${theme["@id"]} has no tokenSourceRefs.`);
    }
    if (new Set(theme.tokenSourceRefs).size !== theme.tokenSourceRefs.length) {
      fail(`Theme ${theme["@id"]} repeats a tokenSourceRef.`);
    }
    for (const ref of theme.tokenSourceRefs) {
      if (!tokenSources.has(ref)) fail(`Theme ${theme["@id"]} references missing TokenSource ${ref}.`);
      referencedSources.add(ref);
    }
  }
  for (const ref of tokenSources.keys()) {
    if (!referencedSources.has(ref)) fail(`Generated TokenSource is not selected by a Theme: ${ref}`);
  }
  for (const tokenFile of walkFiles(tokenDirectory).filter((filePath) => filePath.endsWith(".tokens.json"))) {
    if (!sourceTargets.has(tokenFile)) {
      fail(`DTCG token file has no generated TokenSource node: ${path.relative(runRoot, tokenFile)}`);
    }
  }
}

function validateBindings(ujg, manifest, runRoot) {
  const expected = new Map(
    (ujg.nodes ?? [])
      .filter((node) => node?.["@type"] === "Component" || node?.["@type"] === "Template")
      .map((node) => [node["@id"], node["@type"]])
  );
  const designSystems = unique(
    (manifest.interfaces ?? []).flatMap((entry) => Array.isArray(entry.design_systems) ? entry.design_systems : [])
  );

  for (const selectedPath of designSystems) {
    const designSystem = resolveInside(runRoot, selectedPath, "selected design system");
    const bindingPath = path.join(designSystem, "generated", "ds-bindings.manifest.json");
    const binding = readJson(bindingPath, bindingPath);
    if (!Array.isArray(binding.artifacts)) fail(`${bindingPath} must declare artifacts.`);
    const seen = new Set();
    for (const artifact of binding.artifacts) {
      const keys = Object.keys(artifact).sort();
      if (JSON.stringify(keys) !== JSON.stringify(["export", "module", "type", "ujgRef"])) {
        fail(`${bindingPath} artifact entries may contain only export, module, type, and ujgRef.`);
      }
      if (expected.get(artifact.ujgRef) !== artifact.type) {
        fail(`${bindingPath} contains an unknown or mismatched binding: ${artifact.ujgRef}`);
      }
      if (seen.has(artifact.ujgRef)) fail(`${bindingPath} repeats binding ${artifact.ujgRef}.`);
      seen.add(artifact.ujgRef);
    }
    for (const ref of expected.keys()) {
      if (!seen.has(ref)) fail(`${bindingPath} is missing binding ${ref}.`);
    }
  }
}

function validateNoIdentifierLeaks(runRoot, runUjgPath, manifestPath, ujg) {
  const allowed = new Set([path.resolve(runUjgPath), path.resolve(manifestPath)]);
  const identifiers = new Set();
  visitObjects(ujg, (object) => {
    for (const key of ["@id", "id"]) {
      if (typeof object[key] === "string") identifiers.add(object[key]);
    }
  });
  for (const filePath of walkFiles(path.join(runRoot, "ujg", "schemas"))) allowed.add(path.resolve(filePath));
  for (const bindingPath of walkFiles(runRoot).filter((candidate) => candidate.endsWith("/generated/ds-bindings.manifest.json"))) {
    allowed.add(path.resolve(bindingPath));
  }

  for (const filePath of walkFiles(runRoot)) {
    if (allowed.has(path.resolve(filePath)) || !textExtensions.has(path.extname(filePath))) continue;
    const source = fs.readFileSync(filePath, "utf8");
    if ([...identifiers].some((identifier) => source.includes(identifier))) {
      fail(`UJG identifier leaked outside allowed inputs/bindings: ${path.relative(runRoot, filePath)}`);
    }
    if (/\bujgRef\b/.test(source)) fail(`UJG-to-code mapping leaked outside bindings: ${path.relative(runRoot, filePath)}`);
  }

  const prohibitedPatterns = [
    /(^|\/)generation\.json$/,
    /(^|\/)(journey|realization|screen|transition)-map\.[^/]+$/,
    /(^|\/)trace-matrix\.[^/]+$/,
    /(^|\/)generated\/(?!ds-bindings\.manifest\.json$)/
  ];
  for (const filePath of walkFiles(runRoot)) {
    const relative = path.relative(runRoot, filePath).split(path.sep).join("/");
    if (prohibitedPatterns.some((pattern) => pattern.test(relative))) {
      fail(`Prohibited generated projection: ${relative}`);
    }
  }
}

export function seedFullApplicationRun({ repoRoot, runsRoot, runName }) {
  assertRunName(runName);
  const target = assertInside(runsRoot, path.join(runsRoot, runName), "run target");
  if (fs.existsSync(target)) fail(`Run already exists: ${target}`);

  const canonicalUjgPath = path.join(repoRoot, "ujg", "workshop-registration.ujg.jsonld");
  const canonicalManifestPath = path.join(repoRoot, "ujg-implementation.yaml");
  const canonicalUjg = readJson(canonicalUjgPath, "canonical UJG");
  if ((canonicalUjg.nodes ?? []).some((node) => generatedTokenNodeTypes.has(node?.["@type"]))) {
    fail("The canonical experiment UJG must not contain Theme or TokenSource nodes before generation.");
  }
  const sources = unique(schemaSources(canonicalUjg));

  try {
    fs.mkdirSync(path.join(target, "ujg", "schemas"), { recursive: true });
    fs.copyFileSync(
      canonicalUjgPath,
      path.join(target, "ujg", "workshop-registration.ujg.jsonld")
    );
    fs.copyFileSync(canonicalManifestPath, path.join(target, "ujg-implementation.yaml"));
    for (const source of sources) {
      const canonicalSchema = resolveInside(path.dirname(canonicalUjgPath), source, `DataSchema source ${source}`);
      const relative = path.relative(path.dirname(canonicalUjgPath), canonicalSchema);
      const targetSchema = path.join(target, "ujg", relative);
      fs.mkdirSync(path.dirname(targetSchema), { recursive: true });
      fs.copyFileSync(canonicalSchema, targetSchema);
    }
  } catch (error) {
    fs.rmSync(target, { recursive: true, force: true });
    throw error;
  }

  return target;
}

export function beginFullApplicationPhase({ repoRoot, runsRoot, runName, phase }) {
  assertRunName(runName);
  const runRoot = assertInside(runsRoot, path.join(runsRoot, runName), "run target");
  if (!fs.statSync(runRoot, { throwIfNoEntry: false })?.isDirectory()) fail(`Run does not exist: ${runRoot}`);
  if (phase === "structure" && !fs.existsSync(path.join(runRoot, phaseStateFile))) {
    validateFullApplicationRun({ repoRoot, runsRoot, runName, phase: "seed" });
  }
  assertNoRunEvaluations(repoRoot, runName);
  beginPhase({ runRoot, runName, phase });
  return runRoot;
}

export function validateFullApplicationRun({ repoRoot, runsRoot, runName, phase = "complete" }) {
  assertRunName(runName);
  if (!validationPhases.includes(phase)) {
    fail(`Validation phase must be one of: ${validationPhases.join(", ")}.`);
  }
  const runRoot = assertInside(runsRoot, path.join(runsRoot, runName), "run target");
  if (!fs.statSync(runRoot, { throwIfNoEntry: false })?.isDirectory()) fail(`Run does not exist: ${runRoot}`);

  const canonicalUjgPath = path.join(repoRoot, "ujg", "workshop-registration.ujg.jsonld");
  const canonicalManifestPath = path.join(repoRoot, "ujg-implementation.yaml");
  const runUjgPath = path.join(runRoot, "ujg", "workshop-registration.ujg.jsonld");
  const runManifestPath = path.join(runRoot, "ujg-implementation.yaml");
  compareFile(canonicalManifestPath, runManifestPath, "run manifest");

  const canonicalUjg = readJson(canonicalUjgPath, "canonical UJG");
  const ujg = readJson(runUjgPath, "run UJG");
  validateUjgBaseIntegrity(canonicalUjg, ujg);
  if (phase === "seed") {
    compareFile(canonicalUjgPath, runUjgPath, "run UJG");
  }
  validateUjgReferences(ujg);
  for (const source of unique(schemaSources(ujg))) {
    const canonicalSchema = resolveInside(path.dirname(canonicalUjgPath), source, `canonical DataSchema source ${source}`);
    const runSchema = resolveInside(path.dirname(runUjgPath), source, `run DataSchema source ${source}`);
    compareFile(canonicalSchema, runSchema, `run schema ${source}`);
    const schema = readJson(runSchema, `run schema ${source}`);
    const expectedNode = (ujg.nodes ?? []).find((node) => node?.dataSchemaSource === source);
    if (schema.$id !== expectedNode?.["@id"]) fail(`Schema identity does not match its UJG DataSchema: ${source}`);
  }

  const manifestSource = fs.readFileSync(runManifestPath, "utf8");
  let manifest;
  try {
    manifest = YAML.parse(manifestSource);
  } catch (error) {
    fail(`Run manifest is not valid YAML: ${error.message}`);
  }
  if (phase === "complete") requireGenerationComplete({ runRoot, runName });
  else if (phase !== "seed") {
    requireActivePhase({ runRoot, runName, phase });
    assertNoRunEvaluations(repoRoot, runName);
  }
  validateManifest(manifest, ujg, runRoot, phase);
  validateTokenSources(ujg, runUjgPath, runRoot, phase);
  validatePhaseBoundaries(manifest, runRoot, phase);

  if (phase === "seed") {
    const allowedRootEntries = new Set(["ujg", "ujg-implementation.yaml"]);
    for (const entry of fs.readdirSync(runRoot)) {
      if (!allowedRootEntries.has(entry)) fail(`Seed contains non-input artifact: ${entry}`);
    }
  } else {
    validateBindings(ujg, manifest, runRoot);
    validateNoIdentifierLeaks(runRoot, runUjgPath, runManifestPath, ujg);
    validateProfileConformance({
      repoRoot,
      runRoot,
      runName,
      phase,
      manifest,
      ujg,
      runUjgPath,
      profile: loadRealizationProfile(repoRoot)
    });
  }

  return runRoot;
}
