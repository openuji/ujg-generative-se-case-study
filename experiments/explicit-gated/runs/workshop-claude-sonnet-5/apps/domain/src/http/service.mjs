/**
 * The workshop service over HTTP.
 *
 * The transport does four things and no more: it works out which route was
 * asked for, resolves who is asking, checks that an incoming body satisfies the
 * contract the route declared, and turns the answer into a response. Every
 * decision that changes anything is taken by the domain behind it.
 */

import { checkAgainstContract, loadDataContracts } from "../dataContracts.mjs";
import { endSession, resolveSession, sessionTokenFromHeaders } from "../identity/sessions.mjs";
import { describeApi } from "./apiDescription.mjs";
import { problem } from "./contracts.mjs";
import { documentationPage } from "./documentationPage.mjs";
import { routes } from "./routes.mjs";

export const descriptionPath = "/api/openapi.json";
export const documentationPath = "/api/docs";

const maximumBodyBytes = 64 * 1024;

function compile(route) {
  const pattern = route.path
    .split("/")
    .map((segment) =>
      segment.startsWith("{") && segment.endsWith("}")
        ? `(?<${segment.slice(1, -1)}>[^/]+)`
        : segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    .join("/");
  return { ...route, matcher: new RegExp(`^${pattern}$`) };
}

function decodeParameters(groups) {
  return Object.fromEntries(
    Object.entries(groups ?? {}).map(([name, value]) => [name, decodeURIComponent(value)])
  );
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maximumBodyBytes) throw new RangeError("The submitted body is too large.");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function resolveBodySchema(schema, contracts) {
  if (typeof schema?.$ref !== "string") return schema;
  return contracts.get(schema.$ref.slice(schema.$ref.lastIndexOf("/") + 1));
}

/**
 * Builds the request handler. `now` lets a caller pin the moment every decision
 * in one request is taken against, which is what makes deadlines testable.
 */
export function createWorkshopService({
  database,
  mailbox,
  appBaseUrl = "http://localhost:5173",
  contracts = loadDataContracts(),
  clock = () => new Date()
}) {
  const table = routes.map(compile);
  const description = describeApi(routes, { contracts });
  const page = documentationPage({ descriptionPath });

  function findRoute(method, pathname) {
    const matches = table.filter((route) => route.matcher.test(pathname));
    if (matches.length === 0) return { route: null, allowed: [] };
    const route = matches.find((candidate) => candidate.method === method) ?? null;
    return { route, allowed: [...new Set(matches.map((candidate) => candidate.method))] };
  }

  async function respond(request) {
    const url = new URL(request.url, "http://workshops.invalid");
    const pathname = url.pathname.length > 1 && url.pathname.endsWith("/")
      ? url.pathname.slice(0, -1)
      : url.pathname;

    if (request.method === "GET" && pathname === descriptionPath) {
      return { status: 200, body: description };
    }
    if (request.method === "GET" && pathname === documentationPath) {
      return { status: 200, contentType: "text/html; charset=utf-8", text: page };
    }

    const { route, allowed } = findRoute(request.method, pathname);
    if (route === null) {
      if (allowed.length > 0) {
        return {
          status: 405,
          headers: { allow: allowed.join(", ") },
          body: problem(`That address answers ${allowed.join(" and ")} requests.`)
        };
      }
      return { status: 404, body: problem("There is nothing at that address.") };
    }

    const token = sessionTokenFromHeaders(request.headers);
    const participant = token === null ? null : resolveSession(database, token);
    if (route.session === "required" && participant === null) {
      return { status: 401, body: problem("Sign in as a participant first.") };
    }

    let body;
    if (route.requestBody !== undefined) {
      let raw;
      try {
        raw = await readBody(request);
      } catch (error) {
        return { status: 413, body: problem(error.message) };
      }
      try {
        body = raw.length === 0 ? {} : JSON.parse(raw);
      } catch {
        return { status: 400, body: problem("The submitted body is not JSON.") };
      }
      const problems = checkAgainstContract(resolveBodySchema(route.requestBody.schema, contracts), body);
      if (problems.length > 0) {
        return { status: 400, body: problem("The submitted body does not match this route's contract.", problems) };
      }
    }

    return route.handle({
      database,
      mailbox,
      appBaseUrl,
      params: decodeParameters(pathname.match(route.matcher)?.groups),
      query: url.searchParams,
      body,
      participant,
      now: clock(),
      endCurrentSession: () => endSession(database, token)
    });
  }

  async function handler(request, response) {
    response.setHeader("access-control-allow-origin", "*");
    response.setHeader("access-control-allow-headers", "authorization, content-type");
    response.setHeader("access-control-allow-methods", "GET, POST, DELETE, OPTIONS");
    if (request.method === "OPTIONS") {
      response.writeHead(204).end();
      return;
    }

    let answer;
    try {
      answer = await respond(request);
    } catch (error) {
      answer = { status: 500, body: problem(`The service could not complete that request: ${error.message}`) };
    }

    for (const [name, value] of Object.entries(answer.headers ?? {})) response.setHeader(name, value);
    if (answer.status === 204 || (answer.body === undefined && answer.text === undefined)) {
      response.writeHead(answer.status).end();
      return;
    }
    const payload = answer.text ?? `${JSON.stringify(answer.body, null, 2)}\n`;
    response.setHeader("content-type", answer.contentType ?? "application/json; charset=utf-8");
    response.setHeader("content-length", Buffer.byteLength(payload));
    response.writeHead(answer.status).end(payload);
  }

  return { handler, routes: table, description, contracts };
}
