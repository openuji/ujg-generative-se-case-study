import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { dataSchemas, operations } from "../domain/reference/src/http/contract.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "ujg/workshop-registration.ujg.jsonld");
const outputPath = path.join(root, "domain/reference/openapi/openapi.json");
const check = process.argv.includes("--check");

const sourceBytes = await readFile(sourcePath);
const ujg = JSON.parse(sourceBytes);
const sourceIds = new Set();
const sourceNodes = new Map();
const visit = (value) => {
  if (Array.isArray(value)) return value.forEach(visit);
  if (!value || typeof value !== "object") return;
  if (typeof value["@id"] === "string") {
    sourceIds.add(value["@id"]);
    sourceNodes.set(value["@id"], value);
  }
  for (const child of Object.values(value)) visit(child);
};
visit(ujg);

const assertRef = (ref, label) => {
  if (ref && !sourceIds.has(ref)) throw new Error(`${label} references missing UJG node ${ref}`);
};

const canonicalSchemas = {};
for (const [name, relativePath] of Object.entries(dataSchemas)) {
  canonicalSchemas[name] = JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

const inputSchema = (canonicalName, fields) => ({
  type: "object",
  required: ["name", "email"],
  properties: Object.fromEntries(fields.map((field) => [field, canonicalSchemas[canonicalName].properties[field]])),
  additionalProperties: false
});

const variant = (name, dataSchema) => ({
  type: "object",
  required: ["outcome", "data"],
  properties: {
    outcome: { type: "string", const: name },
    data: { $ref: `#/components/schemas/${dataSchema}` }
  },
  additionalProperties: false
});

const responseSchema = (operation) => ({
  oneOf: operation.outcomes.map(({ name, dataSchema }) => variant(name, dataSchema))
});

const schemas = {
  ...canonicalSchemas,
  RegistrationDetailsInput: inputSchema("RegistrationFormData", ["name", "email", "accessibilityNotes"]),
  WaitlistDetailsInput: inputSchema("WaitlistFormData", ["name", "email", "notes"]),
  WorkshopCollectionData: {
    type: "object",
    required: ["items"],
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          required: ["workshopId", "data"],
          properties: {
            workshopId: { type: "string" },
            data: { $ref: "#/components/schemas/WorkshopTeaserData" }
          },
          additionalProperties: false
        }
      }
    },
    additionalProperties: false
  },
  ErrorResponse: {
    type: "object",
    required: ["error"],
    properties: { error: { type: "string" } },
    additionalProperties: false
  }
};

for (const operation of operations) {
  assertRef(operation.entryRef, operation.operationId);
  assertRef(operation.commandRef, operation.operationId);
  assertRef(operation.conditionSetRef, operation.operationId);
  for (const item of operation.outcomes) {
    assertRef(item.stateRef, `${operation.operationId}/${item.name}`);
    assertRef(item.transitionRef, `${operation.operationId}/${item.name}`);
  }
  if (operation.conditionSetRef) {
    const modeledTransitions = sourceNodes.get(operation.conditionSetRef).conditionTransitionRefs;
    const contractedTransitions = operation.outcomes.map(({ transitionRef }) => transitionRef);
    if (JSON.stringify(modeledTransitions) !== JSON.stringify(contractedTransitions)) {
      throw new Error(`${operation.operationId} does not preserve its complete modeled outcome order`);
    }
  }
  schemas[operation.responseSchema] = responseSchema(operation);
}

const modeledEffects = [...sourceNodes.values()]
  .filter((node) => node["@type"] === "Transition" && node.effectRef)
  .map((node) => node.effectRef)
  .sort();
const contractedEffects = operations
  .flatMap((operation) => operation.outcomes.map(({ transitionRef }) => sourceNodes.get(transitionRef)?.effectRef))
  .filter(Boolean)
  .sort();
if (JSON.stringify(modeledEffects) !== JSON.stringify(contractedEffects)) {
  throw new Error("The API contract does not cover every modeled effect exactly once");
}

const paths = {};
for (const operation of operations) {
  const responses = {
    200: {
      description: "Modeled outcome resolved from current facts",
      content: { "application/json": { schema: { $ref: `#/components/schemas/${operation.responseSchema}` } } }
    },
    404: {
      description: "Resource not found or not exposed to the authenticated subject",
      content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
    }
  };
  if (operation.auth) {
    responses[401] = {
      description: "Authentication required",
      content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
    };
  }
  if (operation.requestSchema) {
    responses[400] = {
      description: "Invalid request data",
      content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
    };
  }
  if (operation.commandRef) {
    responses[409] = {
      description: "The command cannot resolve from the current domain facts",
      content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
    };
  }

  paths[operation.path] ??= {};
  paths[operation.path][operation.method] = {
    operationId: operation.operationId,
    summary: operation.summary,
    ...(operation.entryRef ? { "x-ujg-entry-ref": operation.entryRef } : {}),
    ...(operation.commandRef ? { "x-ujg-command-ref": operation.commandRef } : {}),
    ...(operation.conditionSetRef ? { "x-ujg-condition-set-ref": operation.conditionSetRef } : {}),
    ...(operation.inputDataSchemaRef ? { "x-ujg-input-data-schema-ref": operation.inputDataSchemaRef } : {}),
    "x-ujg-outcomes": operation.outcomes,
    ...(operation.auth ? { security: [{ bearerAuth: [] }] } : {}),
    ...(operation.parameters ? { parameters: operation.parameters } : {}),
    ...(operation.requestSchema ? {
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: `#/components/schemas/${operation.requestSchema}` } } }
      }
    } : {}),
    responses
  };
}

const openapi = {
  openapi: "3.1.0",
  info: {
    title: "Workshop registration reference API",
    version: "1.0.0",
    description: "Generated realization contract. The canonical UJG remains the behavioral source of truth."
  },
  "x-ujg-source": "ujg/workshop-registration.ujg.jsonld",
  "x-ujg-source-sha256": createHash("sha256").update(sourceBytes).digest("hex"),
  servers: [{ url: "http://localhost:3000" }],
  paths,
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", description: "Fake fixture identity token for the reference realization." }
    },
    schemas
  }
};

const rendered = `${JSON.stringify(openapi, null, 2)}\n`;
if (check) {
  const existing = await readFile(outputPath, "utf8").catch(() => "");
  if (existing !== rendered) {
    throw new Error("Generated OpenAPI is stale. Run pnpm generate:openapi.");
  }
  console.log(`OpenAPI is current (${operations.length} operations).`);
} else {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, rendered);
  console.log(`Generated ${path.relative(root, outputPath)} (${operations.length} operations).`);
}
