import { createServer } from "node:http";

import Ajv from "ajv";

import { FakeAuthAdapter } from "../adapters/fake-auth-adapter.mjs";
import { DomainError } from "../domain/errors.mjs";
import { WorkshopService } from "../domain/workshop-service.mjs";
import { operations } from "./contract.mjs";
import { openApiDocument, swaggerUiHtml } from "./openapi.mjs";

const ajv = new Ajv({ allErrors: true, strict: false });

const handlers = {
  listWorkshops: ({ service }) => service.listWorkshops(),
  getWorkshop: ({ service, participant, params }) => service.getWorkshop(participant, params.workshopId),
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
  const validate = operation.requestSchema ? ajv.compile(operation.requestSchema) : undefined;
  const validateResponse = ajv.compile(operation.responseSchema);
  return { ...operation, names, regex: new RegExp(`^${expression}$`), validate, validateResponse };
});

const sendJson = (response, status, body) => {
  const payload = `${JSON.stringify(body)}\n`;
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload)
  });
  response.end(payload);
};

const sendText = (response, status, body, contentType) => {
  response.writeHead(status, {
    "content-type": contentType,
    "content-length": Buffer.byteLength(body)
  });
  response.end(body);
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
      if (request.method === "GET" && url.pathname === "/api/openapi.json") {
        return sendJson(response, 200, openApiDocument());
      }
      if (request.method === "GET" && ["/api/docs", "/api/docs/"].includes(url.pathname)) {
        return sendText(response, 200, swaggerUiHtml(), "text/html; charset=utf-8");
      }

      const route = routes.find((candidate) => candidate.method.toUpperCase() === request.method && candidate.regex.test(url.pathname));
      if (!route) return sendJson(response, 404, { error: "Route not found." });

      const match = route.regex.exec(url.pathname);
      const params = Object.fromEntries(route.names.map((name, index) => [name, decodeURIComponent(match[index + 1])]));
      const participant = route.auth ? auth.authenticate(request.headers.authorization) : undefined;
      if (route.auth && !participant) return sendJson(response, 401, { error: "Authentication required." });

      const body = route.requestSchema ? await readJson(request) : undefined;
      if (route.validate && !route.validate(body)) {
        return sendJson(response, 400, { error: "Request data does not match the operation contract." });
      }

      const result = await handlers[route.operationId]({ service, participant, params, body });
      if (!route.validateResponse(result)) {
        throw new Error(`Operation ${route.operationId} produced a response outside its HTTP contract.`);
      }
      return sendJson(response, 200, result);
    } catch (error) {
      if (error instanceof DomainError) return sendJson(response, error.status, { error: error.message });
      console.error(error);
      return sendJson(response, 500, { error: "Internal server error." });
    }
  });
}
