import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import YAML from "yaml";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(repoRoot, "ujg-implementation.yaml");
const manifest = YAML.parse(fs.readFileSync(manifestPath, "utf8"));

if (![3, 4].includes(manifest?.manifest_version) || typeof manifest.ujg !== "string") {
  throw new Error("ujg-implementation.yaml must be a version 3 or 4 manifest with a UJG path");
}

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function requireExistingPath(value, label, { directory = false } = {}) {
  requireString(value, label);
  const resolved = path.resolve(repoRoot, value);
  const relative = path.relative(repoRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${label} must resolve inside the repository: ${value}`);
  }
  if (!fs.existsSync(resolved)) {
    throw new Error(`${label} does not exist: ${value}`);
  }
  if (directory && !fs.statSync(resolved).isDirectory()) {
    throw new Error(`${label} must be a directory: ${value}`);
  }
  return resolved;
}

const ujgPath = path.resolve(repoRoot, manifest.ujg);
const ujgRaw = fs.readFileSync(ujgPath, "utf8");
const ujg = JSON.parse(ujgRaw);
const domainModel = ujg.extensions?.["org.openuji.domain-model"];
const domainSchemaPath = path.join(
  repoRoot,
  "docs/skills/ujg-topology-to-domain-model-derivation/references/domain-model.schema.json"
);
const domainSchema = JSON.parse(fs.readFileSync(domainSchemaPath, "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateDomainModel = ajv.compile(domainSchema);

if (!validateDomainModel(domainModel)) {
  throw new Error(`Domain Model schema validation failed:\n${ajv.errorsText(validateDomainModel.errors, { separator: "\n" })}`);
}

const ids = new Map();

function visitObjects(value, visitor) {
  if (Array.isArray(value)) {
    for (const item of value) visitObjects(item, visitor);
    return;
  }

  if (!value || typeof value !== "object") return;
  visitor(value);
  for (const child of Object.values(value)) visitObjects(child, visitor);
}

visitObjects(ujg, (value) => {
  for (const key of ["@id", "id"]) {
    const id = value[key];
    if (typeof id !== "string" || !id.startsWith("urn:")) continue;
    if (ids.has(id) && ids.get(id) !== value) throw new Error(`Duplicate identifier: ${id}`);
    ids.set(id, value);
  }
});

const unresolvedRefs = [];

visitObjects(ujg, (value) => {
  for (const [key, candidate] of Object.entries(value)) {
    const refs = key.endsWith("Refs") && Array.isArray(candidate)
      ? candidate
      : key.endsWith("Ref") && typeof candidate === "string"
        ? [candidate]
        : [];

    for (const ref of refs) {
      if (typeof ref === "string" && ref.startsWith("urn:") && !ids.has(ref)) {
        unresolvedRefs.push(`${key}: ${ref}`);
      }
    }
  }
});

if (unresolvedRefs.length > 0) {
  throw new Error(`Unresolved internal references:\n${unresolvedRefs.join("\n")}`);
}

const nodes = ujg.nodes ?? [];
const nodesById = new Map(nodes.map((node) => [node["@id"], node]));
const conditionalSets = nodes.filter((node) => node["@type"] === "ConditionalTransitionSet");

function validateManifestV4() {
  if (manifest.manifest_version !== 4) return;

  const backendPath = manifest.backend ? requireExistingPath(manifest.backend, "backend", { directory: true }) : undefined;
  if (!Array.isArray(manifest.interfaces) || manifest.interfaces.length === 0) {
    throw new Error("manifest v4 must declare at least one interface");
  }

  const touchpoints = nodes.filter((node) => node["@type"] === "Touchpoint");
  const touchpointIds = new Set(touchpoints.map((node) => node["@id"]));
  const assignedTouchpoints = new Set();
  const implementationTargetKinds = new Set(["browser", "cli", "native", "desktop", "embedded"]);

  for (const [index, entry] of manifest.interfaces.entries()) {
    const label = `interfaces[${index}]`;
    requireObject(entry, label);
    requireString(entry.touchpoint_ref, `${label}.touchpoint_ref`);
    requireString(entry.kind, `${label}.kind`);
    requireString(entry.interaction_state_owner, `${label}.interaction_state_owner`);

    if (!["client", "server", "external", "shared"].includes(entry.interaction_state_owner)) {
      throw new Error(`${label}.interaction_state_owner must be client, server, external, or shared`);
    }

    if (!touchpointIds.has(entry.touchpoint_ref)) {
      throw new Error(`${label}.touchpoint_ref does not match a UJG Touchpoint: ${entry.touchpoint_ref}`);
    }
    if (assignedTouchpoints.has(entry.touchpoint_ref)) {
      throw new Error(`Touchpoint is assigned to more than one interface: ${entry.touchpoint_ref}`);
    }
    assignedTouchpoints.add(entry.touchpoint_ref);

    if (implementationTargetKinds.has(entry.kind)) {
      requireExistingPath(entry.target, `${label}.target`, { directory: true });
    } else if (typeof entry.target === "string") {
      requireExistingPath(entry.target, `${label}.target`, { directory: true });
    }

    if (!Array.isArray(entry.design_systems) || entry.design_systems.length === 0) {
      throw new Error(`${label}.design_systems must be a non-empty array`);
    }
    for (const [designSystemIndex, designSystem] of entry.design_systems.entries()) {
      const designSystemPath = requireExistingPath(designSystem, `${label}.design_systems[${designSystemIndex}]`, { directory: true });
      const bindingManifest = path.join(designSystemPath, "generated/ds-bindings.manifest.json");
      if (!fs.existsSync(bindingManifest)) {
        throw new Error(`${label}.design_systems[${designSystemIndex}] is missing generated/ds-bindings.manifest.json`);
      }
    }

    if (entry.transport !== undefined) {
      requireObject(entry.transport, `${label}.transport`);
      requireString(entry.transport.protocol, `${label}.transport.protocol`);
      if (entry.transport.protocol === "http") {
        if (!backendPath) throw new Error(`${label}.transport.protocol http requires a backend path`);
        requireObject(entry.transport.documentation, `${label}.transport.documentation`);
        if (entry.transport.documentation.format !== "openapi") {
          throw new Error(`${label}.transport.documentation.format must be openapi`);
        }
        if (entry.transport.documentation.output !== undefined) {
          const documentationPath = requireExistingPath(entry.transport.documentation.output, `${label}.transport.documentation.output`);
          const documentation = JSON.parse(fs.readFileSync(documentationPath, "utf8"));
          if (typeof documentation.openapi !== "string" || !documentation.openapi.startsWith("3.") || !documentation.paths) {
            throw new Error(`${label}.transport.documentation.output must be an OpenAPI 3 document`);
          }
        }
        if (entry.transport.documentation.ui !== "swagger-ui") {
          throw new Error(`${label}.transport.documentation.ui must be swagger-ui`);
        }
      }
    }

    if (entry.delivery !== undefined) {
      requireObject(entry.delivery, `${label}.delivery`);
      requireString(entry.delivery.adapter, `${label}.delivery.adapter`);
      if (entry.kind === "email" && entry.delivery.adapter !== "fake-client") {
        throw new Error(`${label}.delivery.adapter must be fake-client for the reference email touchpoint`);
      }
    } else if (entry.kind === "email") {
      throw new Error(`${label}.delivery is required for email interfaces`);
    }
  }

  for (const touchpoint of touchpoints) {
    if (!assignedTouchpoints.has(touchpoint["@id"])) {
      throw new Error(`UJG Touchpoint has no realization interface: ${touchpoint["@id"]}`);
    }
  }

  requireObject(manifest.adapters, "adapters");
  if (manifest.adapters.persistence !== "sqlite") {
    throw new Error("adapters.persistence must be sqlite");
  }
  if (manifest.adapters.identity !== "fake-auth-adapter") {
    throw new Error("adapters.identity must be fake-auth-adapter");
  }
  if (!backendPath) throw new Error("manifest v4 requires backend for declared adapters");
  for (const adapterFile of ["sqlite-store.mjs", "fake-auth-adapter.mjs", "fake-email-client.mjs"]) {
    if (!fs.existsSync(path.join(backendPath, "src/adapters", adapterFile))) {
      throw new Error(`Declared adapter implementation is missing: ${path.join(manifest.backend, "src/adapters", adapterFile)}`);
    }
  }

  if (manifest.bootstrap !== "fixtures") {
    throw new Error("bootstrap must be fixtures");
  }
  for (const bootstrapFile of ["src/fixtures.mjs", "src/fixture-cli.mjs"]) {
    if (!fs.existsSync(path.join(backendPath, bootstrapFile))) {
      throw new Error(`Declared bootstrap implementation is missing: ${path.join(manifest.backend, bootstrapFile)}`);
    }
  }
}

validateManifestV4();

for (const conditionalSet of conditionalSets) {
  if (!Array.isArray(conditionalSet.conditionTransitionRefs) || conditionalSet.conditionTransitionRefs.length < 2) {
    throw new Error(`ConditionalTransitionSet must contain at least two transitions: ${conditionalSet["@id"]}`);
  }

  for (const transitionRef of conditionalSet.conditionTransitionRefs) {
    const transition = nodesById.get(transitionRef);
    if (transition?.["@type"] !== "Transition" || typeof transition.conditionRef !== "string") {
      throw new Error(`Invalid conditional transition ${transitionRef} in ${conditionalSet["@id"]}`);
    }
  }
}

const dataSchemas = nodes.filter((node) => node["@type"] === "DataSchema");

for (const dataSchema of dataSchemas) {
  if (typeof dataSchema.dataSchemaSource !== "string") {
    throw new Error(`DataSchema has no source: ${dataSchema["@id"]}`);
  }

  const schemaPath = path.resolve(path.dirname(ujgPath), dataSchema.dataSchemaSource);
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  if (schema.$id !== dataSchema["@id"]) {
    throw new Error(`DataSchema identifier mismatch: ${dataSchema["@id"]} != ${schema.$id}`);
  }

  new Ajv2020({ allErrors: true, strict: true }).compile(schema);
}

const sourceHash = crypto.createHash("sha256").update(ujgRaw).digest("hex");
console.log(`UJG source is valid (${ids.size} identifiers, ${conditionalSets.length} conditional sets, ${dataSchemas.length} data schemas).`);
console.log(`UJG SHA-256: ${sourceHash}`);
