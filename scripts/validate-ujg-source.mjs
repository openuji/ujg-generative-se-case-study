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
