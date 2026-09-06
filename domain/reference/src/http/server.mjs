import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv from "ajv";

import { FakeAuthAdapter } from "../adapters/fake-auth-adapter.mjs";
import { DomainError } from "../domain/errors.mjs";
import { WorkshopService } from "../domain/workshop-service.mjs";
import { operations } from "./contract.mjs";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const openapi = JSON.parse(await readFile(path.join(backendRoot, "openapi/openapi.json"), "utf8"));
const ajv = new Ajv({ allErrors: true, strict: false });
ajv.addSchema(openapi, "openapi");

const handlers = {
  listWorkshops: ({ service }) => service.listWorkshops(),
  getWorkshop: ({ service, params }) => service.getWorkshop(params.workshopId),
  confirmRegistration: ({ service, participant, params, body }) => service.confirmRegistration(participant, params.workshopId, body),
  joinWaitlist: ({ service, participant, params, body }) => service.joinWaitlist(participant, params.workshopId, body),
  getOffer: ({ service, participant, params }) => service.getOffer(participant, params.offerId),
  acceptOffer: ({ service, participant, params }) => service.acceptOffer(participant, params.offerId),
  declineOffer: ({ service, participant, params }) => service.declineOffer(participant, params.offerId)
};

const routes = operations.map((operation) => {
  const names = [];
  const expression = operation.path.replace(/\{([^}]+)\}/g, (_, name) => {
    names.push(name);
    return "([^/]+)";
  });
  const validate = operation.requestSchema
    ? ajv.compile({ $ref: `openapi#/components/schemas/${operation.requestSchema}` })
    : undefined;
  const validateResponse = ajv.compile({ $ref: `openapi#/components/schemas/${operation.responseSchema}` });
  return { ...operation, names, regex: new RegExp(`^${expression}$`), validate, validateResponse };
});

const send = (response, status, body) => {
  const payload = `${JSON.stringify(body)}\n`;
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload)
  });
  response.end(payload);
};

const readJson = async (request) => {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 64 * 1024) throw new DomainError("Request body is too large.", 400);
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new DomainError("Request body must be valid JSON.", 400);
  }
};

export function createReferenceServer({ store, now } = {}) {
  const service = new WorkshopService(store, { now });
  const auth = new FakeAuthAdapter(store);

  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://reference.local");
      if (request.method === "GET" && url.pathname === "/openapi.json") return send(response, 200, openapi);

      const route = routes.find((candidate) => candidate.method.toUpperCase() === request.method && candidate.regex.test(url.pathname));
      if (!route) return send(response, 404, { error: "Route not found." });

      const match = route.regex.exec(url.pathname);
      const params = Object.fromEntries(route.names.map((name, index) => [name, decodeURIComponent(match[index + 1])]));
      const participant = route.auth ? auth.authenticate(request.headers.authorization) : undefined;
      if (route.auth && !participant) return send(response, 401, { error: "Authentication required." });

      const body = route.requestSchema ? await readJson(request) : undefined;
      if (route.validate && !route.validate(body)) {
        return send(response, 400, { error: "Request data does not match the operation contract." });
      }

      const result = await handlers[route.operationId]({ service, participant, params, body });
      if (!route.validateResponse(result)) {
        throw new Error(`Operation ${route.operationId} produced a response outside its OpenAPI contract.`);
      }
      return send(response, 200, result);
    } catch (error) {
      if (error instanceof DomainError) return send(response, error.status, { error: error.message });
      console.error(error);
      return send(response, 500, { error: "Internal server error." });
    }
  });
}
