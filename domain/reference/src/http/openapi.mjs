import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { operations } from "./contract.mjs";

const defaultOutput = new URL("../../openapi/openapi.json", import.meta.url);

const errorResponseSchema = {
  type: "object",
  required: ["error"],
  properties: {
    error: { type: "string" }
  },
  additionalProperties: false
};

const jsonResponse = (description, schema) => ({
  description,
  content: {
    "application/json": {
      schema
    }
  }
});

const jsonRequestBody = (schema) => ({
  required: true,
  content: {
    "application/json": {
      schema
    }
  }
});

const pathParameters = (operationPath) => [...operationPath.matchAll(/\{([^}]+)\}/g)].map(([, name]) => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string" }
}));

const operationSummary = (operationId) => operationId
  .replace(/([A-Z])/g, " $1")
  .replace(/^./, (value) => value.toUpperCase());

const clone = (value) => structuredClone(value);

export function openApiDocument() {
  const document = {
    openapi: "3.1.0",
    info: {
      title: "Workshop Registration Reference API",
      version: "0.0.0"
    },
    servers: [{ url: "/" }],
    paths: {},
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer"
        }
      },
      schemas: {
        ErrorResponse: errorResponseSchema
      }
    }
  };

  for (const operation of operations) {
    document.paths[operation.path] ??= {};
    const method = operation.method.toLowerCase();
    const responses = {
      200: jsonResponse("Operation outcome.", clone(operation.responseSchema)),
      404: jsonResponse("Route or authorized resource not found.", { $ref: "#/components/schemas/ErrorResponse" }),
      409: jsonResponse("The current domain facts do not allow the requested transition.", { $ref: "#/components/schemas/ErrorResponse" }),
      500: jsonResponse("Unexpected server error.", { $ref: "#/components/schemas/ErrorResponse" })
    };

    if (operation.auth) {
      responses[401] = jsonResponse("Authentication required.", { $ref: "#/components/schemas/ErrorResponse" });
    }
    if (operation.requestSchema) {
      responses[400] = jsonResponse("Request body does not match the operation contract.", { $ref: "#/components/schemas/ErrorResponse" });
    }

    document.paths[operation.path][method] = {
      operationId: operation.operationId,
      summary: operationSummary(operation.operationId),
      "x-auth-required": Boolean(operation.auth),
      parameters: pathParameters(operation.path),
      ...(operation.auth ? { security: [{ bearerAuth: [] }] } : {}),
      ...(operation.requestSchema ? { requestBody: jsonRequestBody(clone(operation.requestSchema)) } : {}),
      responses
    };
  }

  return document;
}

export function stableOpenApiJson() {
  return `${JSON.stringify(openApiDocument(), null, 2)}\n`;
}

export async function writeOpenApiDocument(output = defaultOutput) {
  const outputPath = output instanceof URL ? fileURLToPath(output) : output;
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, stableOpenApiJson());
  return outputPath;
}

export function swaggerUiHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Workshop Registration Reference API</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.addEventListener("load", () => {
        window.ui = SwaggerUIBundle({
          url: "/api/openapi.json",
          dom_id: "#swagger-ui"
        });
      });
    </script>
  </body>
</html>`;
}

const args = process.argv.slice(2);
const check = args.includes("--check");
const outputArg = args.find((arg) => arg !== "--check");
const output = outputArg
  ? path.resolve(process.cwd(), outputArg)
  : fileURLToPath(defaultOutput);

if (check) {
  const expected = stableOpenApiJson();
  const outputPath = output;
  const actual = await fs.readFile(outputPath, "utf8");
  if (actual !== expected) {
    throw new Error(`${path.relative(process.cwd(), outputPath)} is not in sync with the HTTP operation registry.`);
  }
  console.log(`OpenAPI document is in sync: ${path.relative(process.cwd(), outputPath)}`);
} else {
  const outputPath = await writeOpenApiDocument(output);
  console.log(`Wrote OpenAPI document: ${path.relative(process.cwd(), outputPath)}`);
}
