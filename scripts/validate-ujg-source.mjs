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

function requireLocalPath(value, label, root = repoRoot) {
  requireString(value, label);
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)) {
    throw new Error(`${label} must be a local relative path: ${value}`);
  }
  const resolved = path.resolve(root, value);
  const relative = path.relative(root, resolved);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${label} must resolve inside the repository: ${value}`);
  }
  return resolved;
}

const ujgPath = requireLocalPath(manifest.ujg, "manifest.ujg");
if (!fs.existsSync(ujgPath)) {
  throw new Error(`manifest.ujg does not exist: ${manifest.ujg}`);
}
const ujgRaw = fs.readFileSync(ujgPath, "utf8");
const ujg = JSON.parse(ujgRaw);

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

  if (manifest.backend !== undefined) {
    throw new Error("manifest v4 uses domain_engine, not backend");
  }

  if (manifest.domain_engine !== undefined) {
    requireObject(manifest.domain_engine, "domain_engine");
    const domainEnginePath = requireLocalPath(manifest.domain_engine.target, "domain_engine.target");
    requireObject(manifest.domain_engine.runtime, "domain_engine.runtime");
    requireString(manifest.domain_engine.runtime.environment, "domain_engine.runtime.environment");
    requireString(manifest.domain_engine.runtime.version, "domain_engine.runtime.version");
    requireString(manifest.domain_engine.runtime.entrypoint, "domain_engine.runtime.entrypoint");
    requireLocalPath(manifest.domain_engine.runtime.entrypoint, "domain_engine.runtime.entrypoint", domainEnginePath);
  }

  if (!Array.isArray(manifest.interfaces) || manifest.interfaces.length === 0) {
    throw new Error("manifest v4 must declare at least one interface");
  }

  const touchpoints = nodes.filter((node) => node["@type"] === "Touchpoint");
  const touchpointIds = new Set(touchpoints.map((node) => node["@id"]));
  const assignedTouchpoints = new Set();
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

    if (entry.target !== undefined) {
      requireLocalPath(entry.target, `${label}.target`);
    }

    if (entry.design_systems !== undefined) {
      if (!Array.isArray(entry.design_systems)) {
        throw new Error(`${label}.design_systems must be an array when declared`);
      }
      for (const [designSystemIndex, designSystem] of entry.design_systems.entries()) {
        requireLocalPath(designSystem, `${label}.design_systems[${designSystemIndex}]`);
      }
    }

    if (entry.transport !== undefined) {
      requireObject(entry.transport, `${label}.transport`);
      requireString(entry.transport.protocol, `${label}.transport.protocol`);
      if (entry.transport.documentation !== undefined) {
        requireObject(entry.transport.documentation, `${label}.transport.documentation`);
        requireString(entry.transport.documentation.format, `${label}.transport.documentation.format`);
        if (entry.transport.documentation.output !== undefined) {
          requireLocalPath(entry.transport.documentation.output, `${label}.transport.documentation.output`);
        }
        if (entry.transport.documentation.ui !== undefined) {
          requireString(entry.transport.documentation.ui, `${label}.transport.documentation.ui`);
        }
      }
    }

    if (entry.delivery !== undefined) {
      requireObject(entry.delivery, `${label}.delivery`);
      requireString(entry.delivery.adapter, `${label}.delivery.adapter`);
    }
  }

  for (const touchpoint of touchpoints) {
    if (!assignedTouchpoints.has(touchpoint["@id"])) {
      throw new Error(`UJG Touchpoint has no realization interface: ${touchpoint["@id"]}`);
    }
  }

  if (manifest.adapters !== undefined) {
    requireObject(manifest.adapters, "adapters");
    for (const [adapterName, adapter] of Object.entries(manifest.adapters)) {
      if (typeof adapter === "string") {
        requireString(adapter, `adapters.${adapterName}`);
      } else {
        requireObject(adapter, `adapters.${adapterName}`);
      }
    }
  }

  if (manifest.bootstrap !== undefined && typeof manifest.bootstrap !== "string") {
    requireObject(manifest.bootstrap, "bootstrap");
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
