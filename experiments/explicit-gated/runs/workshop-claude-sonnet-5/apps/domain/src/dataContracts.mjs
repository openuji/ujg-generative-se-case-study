/**
 * The product's wire contracts.
 *
 * The workshop product already ships a set of authored JSON Schema documents
 * describing the shapes its screens exchange. The service reuses those
 * documents verbatim rather than restating the same fields a second time: they
 * are the request and response body shapes on the wire, the validation rules
 * for incoming bodies, and the component schemas of the served API
 * description.
 */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultContractDirectory = fileURLToPath(new URL("../../../ujg/schemas/", import.meta.url));

const schemaFileSuffix = ".schema.json";
const dataSuffix = "Data";

function contractName(fileName) {
  const stem = fileName.slice(0, -schemaFileSuffix.length);
  const camel = stem
    .split("-")
    .filter((part) => part.length > 0)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
  return camel.endsWith(dataSuffix) ? camel.slice(0, -dataSuffix.length) : camel;
}

/** Strips document-level metadata that only makes sense in the authored file. */
function asComponentSchema(schema) {
  if (Array.isArray(schema)) return schema.map(asComponentSchema);
  if (schema === null || typeof schema !== "object") return schema;
  const copy = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === "$schema" || key === "$id") continue;
    copy[key] = asComponentSchema(value);
  }
  return copy;
}

export function loadDataContracts(directory = defaultContractDirectory) {
  const contracts = new Map();
  const fileNames = readdirSync(directory)
    .filter((fileName) => fileName.endsWith(schemaFileSuffix))
    .sort();
  if (fileNames.length === 0) {
    throw new Error(`No product data contracts found in ${directory}.`);
  }
  for (const fileName of fileNames) {
    const authored = JSON.parse(readFileSync(path.join(directory, fileName), "utf8"));
    contracts.set(contractName(fileName), asComponentSchema(authored));
  }
  return contracts;
}

function typeMatches(expected, value) {
  switch (expected) {
    case "object":
      return typeof value === "object" && value !== null && !Array.isArray(value);
    case "array":
      return Array.isArray(value);
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "integer":
      return Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
    default:
      return true;
  }
}

/**
 * Checks a value against the subset of JSON Schema the product's authored
 * contracts use. Returns a list of `{ pointer, message }` problems; an empty
 * list means the value conforms.
 */
export function checkAgainstContract(schema, value, pointer = "") {
  const problems = [];
  if (schema === true || schema === undefined) return problems;
  if (schema === false) return [{ pointer, message: "no value is allowed here" }];

  const expectedTypes = schema.type === undefined
    ? []
    : Array.isArray(schema.type)
      ? schema.type
      : [schema.type];
  if (expectedTypes.length > 0 && !expectedTypes.some((expected) => typeMatches(expected, value))) {
    problems.push({ pointer, message: `expected ${expectedTypes.join(" or ")}` });
    return problems;
  }

  if (Array.isArray(schema.enum) && !schema.enum.some((allowed) => allowed === value)) {
    problems.push({ pointer, message: `expected one of ${schema.enum.join(", ")}` });
  }

  if (typeMatches("object", value)) {
    for (const required of schema.required ?? []) {
      if (!Object.hasOwn(value, required)) {
        problems.push({ pointer: `${pointer}/${required}`, message: "is required" });
      }
    }
    const properties = schema.properties ?? {};
    for (const [key, entry] of Object.entries(value)) {
      if (Object.hasOwn(properties, key)) {
        problems.push(...checkAgainstContract(properties[key], entry, `${pointer}/${key}`));
        continue;
      }
      if (schema.additionalProperties === false) {
        problems.push({ pointer: `${pointer}/${key}`, message: "is not an allowed property" });
      } else if (typeof schema.additionalProperties === "object") {
        problems.push(...checkAgainstContract(schema.additionalProperties, entry, `${pointer}/${key}`));
      }
    }
  }

  if (Array.isArray(value) && schema.items !== undefined) {
    value.forEach((entry, index) => {
      problems.push(...checkAgainstContract(schema.items, entry, `${pointer}/${index}`));
    });
  }

  return problems;
}

export function conformsToContract(schema, value) {
  return checkAgainstContract(schema, value).length === 0;
}
