/**
 * A running service to make requests against.
 *
 * The service is put on a loopback port with a seeded catalogue behind it and
 * the moment every decision is taken against pinned, so a test can ask real
 * questions over the wire and still know what the answers should be.
 */

import { createServer } from "node:http";

import { createWorkshopService } from "../../src/http/service.mjs";
import { createMailbox } from "../../src/messaging/mailbox.mjs";
import { freshCatalogue, shortlyAfter } from "./catalogue.mjs";

export async function startTestService({ now = shortlyAfter, appBaseUrl = "http://localhost:5173" } = {}) {
  const database = freshCatalogue();
  const mailbox = createMailbox();
  const service = createWorkshopService({ database, mailbox, appBaseUrl, clock: () => now });
  const server = createServer(service.handler);

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;

  async function call(method, route, { token, body } = {}) {
    const response = await fetch(`${origin}${route}`, {
      method,
      headers: {
        ...(token === undefined ? {} : { authorization: `Bearer ${token}` }),
        ...(body === undefined ? {} : { "content-type": "application/json" })
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    const text = await response.text();
    const contentType = response.headers.get("content-type") ?? "";
    return {
      status: response.status,
      headers: response.headers,
      text,
      body: contentType.includes("application/json") && text.length > 0 ? JSON.parse(text) : undefined
    };
  }

  async function signIn(participantId) {
    const answer = await call("POST", "/api/sessions", { body: { participantId } });
    return answer.body.token;
  }

  async function close() {
    await new Promise((resolve) => server.close(resolve));
    database.close();
  }

  return { origin, call, signIn, close, database, mailbox, service };
}
