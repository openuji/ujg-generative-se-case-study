/**
 * The description of what this service accepts and returns.
 *
 * It is assembled in memory from the route table the running service actually
 * dispatches and from the product's authored data contracts, so it can never
 * describe a route that is not there or a shape nobody agreed to. It is never
 * written to disk.
 */

import { loadDataContracts } from "../dataContracts.mjs";
import { problemSchema } from "./contracts.mjs";

const sessionSecurityScheme = "participantSession";

function pathParameters(path) {
  return [...path.matchAll(/\{([^{}]+)\}/g)].map(([, name]) => ({
    name,
    in: "path",
    required: true,
    schema: { type: "string" },
    description: `Identifies the ${name.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()}.`
  }));
}

function responseEntries(route) {
  const entries = route.responses.map((response) => [
    String(response.status),
    response.status === 204
      ? { description: response.description }
      : {
        description: response.description,
        content: { "application/json": { schema: response.schema ?? problemSchema } }
      }
  ]);
  if (route.session === "required") {
    entries.push([
      "401",
      {
        description: "No participant is signed in.",
        content: { "application/json": { schema: problemSchema } }
      }
    ]);
  }
  if (route.requestBody !== undefined) {
    entries.push([
      "400",
      {
        description: "The submitted body does not satisfy this route's contract.",
        content: { "application/json": { schema: problemSchema } }
      }
    ]);
  }
  return Object.fromEntries(entries);
}

function operation(route) {
  const parameters = pathParameters(route.path);
  return {
    operationId: route.operationId,
    summary: route.summary,
    ...(route.description === undefined ? {} : { description: route.description }),
    ...(route.tag === undefined ? {} : { tags: [route.tag] }),
    ...(parameters.length === 0 ? {} : { parameters }),
    ...(route.requestBody === undefined
      ? {}
      : {
        requestBody: {
          required: true,
          description: route.requestBody.description,
          content: { "application/json": { schema: route.requestBody.schema } }
        }
      }),
    security: route.session === "required" ? [{ [sessionSecurityScheme]: [] }] : [],
    responses: responseEntries(route)
  };
}

/**
 * Builds the API description for `routes`. The product's data contracts become
 * its component schemas, referenced by name from every route that carries one.
 */
export function describeApi(routes, { contracts = loadDataContracts(), version = "1.0.0" } = {}) {
  const paths = {};
  for (const route of routes) {
    const entry = paths[route.path] ?? (paths[route.path] = {});
    entry[route.method.toLowerCase()] = operation(route);
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "Workshop registration",
      version,
      description:
        "Browsing workshops, booking a place, joining a waitlist, and answering a place offered to one participant. Every decision that changes anything is taken here."
    },
    servers: [{ url: "/", description: "This service." }],
    tags: [
      { name: "Signing in", description: "Choosing which seeded participant is asking." },
      { name: "Workshops", description: "The catalogue and one workshop's detail." },
      { name: "Registration", description: "Booking a place." },
      { name: "Waitlist", description: "Joining a waitlist and reading a standing on one." },
      { name: "Offered places", description: "Answering a place offered to one participant." }
    ],
    components: {
      schemas: Object.fromEntries([...contracts].sort(([left], [right]) => left.localeCompare(right))),
      securitySchemes: {
        [sessionSecurityScheme]: {
          type: "http",
          scheme: "bearer",
          description: "The token returned when signing in as a seeded participant."
        }
      }
    },
    paths
  };
}
