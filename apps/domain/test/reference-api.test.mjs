import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { afterEach, beforeEach, test } from "node:test";

import Ajv2020 from "ajv/dist/2020.js";

import { MemoryFakeEmailClient } from "../src/adapters/fake-email-client.mjs";
import { SqliteStore } from "../src/adapters/sqlite-store.mjs";
import { loadFixtures } from "../src/fixtures.mjs";
import { operations } from "../src/http/contract.mjs";
import { openApiDocument } from "../src/http/openapi.mjs";
import { createReferenceServer } from "../src/http/server.mjs";

const offerSummarySchema = JSON.parse(
  await readFile(new URL("../../../ujg/schemas/offer-summary-data.schema.json", import.meta.url), "utf8")
);
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateOfferSummary = ajv.compile(offerSummarySchema);

const fixedNow = () => new Date("2026-09-06T10:00:00.000Z");
let store;
let server;
let baseUrl;
let emailClient;

beforeEach(async () => {
  store = new SqliteStore(":memory:");
  emailClient = new MemoryFakeEmailClient();
  await loadFixtures(store, emailClient);
  server = createReferenceServer({ store, now: fixedNow });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
  store.close();
});

const request = async (pathname, { token, body, method = body ? "POST" : "GET" } = {}) => {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { "content-type": "application/json" } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return { status: response.status, body: await response.json() };
};

const registration = { name: "Blair Jensen", email: "blair@example.com", accessibilityNotes: "Step-free access" };
const waitlist = { name: "Blair Jensen", email: "blair@example.com", notes: "Afternoons preferred" };

test("fixtures materialize all workshop contextual entries and one email continuation", async () => {
  const list = await request("/api/workshops");
  assert.equal(list.status, 200);
  assert.equal(list.body.outcome, "overview");
  assert.equal(list.body.data.items.length, 3);

  const unauthenticated = await request("/api/workshops/service-design-foundations");
  assert.equal(unauthenticated.status, 401);

  const alreadyRegistered = await request("/api/workshops/service-design-foundations", { token: "token-alex" });
  assert.equal(alreadyRegistered.status, 200);
  assert.equal(alreadyRegistered.body.outcome, "alreadyRegistered");
  assert.equal(alreadyRegistered.body.data.summary.availability, "Already registered");
  assert.equal(alreadyRegistered.body.data.notice.message, "You are already registered for this workshop.");
  assert.equal("status" in alreadyRegistered.body.data, false);
  assert.equal("details" in alreadyRegistered.body.data.notice, false);

  const alreadyWaitlisted = await request("/api/workshops/facilitation-practice", { token: "token-alex" });
  assert.equal(alreadyWaitlisted.status, 200);
  assert.equal(alreadyWaitlisted.body.outcome, "alreadyWaitlisted");
  assert.equal(alreadyWaitlisted.body.data.summary.availability, "Already waitlisted");
  assert.equal(alreadyWaitlisted.body.data.notice.message, "You are already on the waitlist for this workshop.");
  assert.equal("status" in alreadyWaitlisted.body.data, false);
  assert.equal("details" in alreadyWaitlisted.body.data.notice, false);

  const open = await request("/api/workshops/service-design-foundations", { token: "token-blair" });
  const waitlistOpen = await request("/api/workshops/facilitation-practice", { token: "token-blair" });
  const closed = await request("/api/workshops/research-operations", { token: "token-blair" });
  assert.equal(open.body.outcome, "registrationOpen");
  assert.equal(waitlistOpen.body.outcome, "waitlistOpen");
  assert.equal(closed.body.outcome, "registrationClosed");
  assert.equal(emailClient.messages.length, 1);
  assert.equal(validateOfferSummary(emailClient.messages[0].body), true, ajv.errorsText(validateOfferSummary.errors));
  assert.deepEqual(emailClient.messages[0].body, {
    title: "A workshop place is available",
    message: "A place has opened for you from the waitlist.",
    workshopTitle: "Facilitation Practice",
    expiresAt: "2099-10-18T12:00:00.000Z"
  });
  assert.deepEqual(emailClient.messages[0].action, {
    label: "Open offered place",
    href: "http://localhost:5173/offers/offer-alex-open"
  });
});

test("OpenAPI documentation is derived from the HTTP operation registry", async () => {
  const document = openApiDocument();
  for (const operation of operations) {
    const openApiOperation = document.paths[operation.path]?.[operation.method.toLowerCase()];
    assert.ok(openApiOperation, `${operation.method} ${operation.path} is missing from OpenAPI output`);
    assert.equal(openApiOperation.operationId, operation.operationId);
    assert.equal(openApiOperation["x-auth-required"], operation.auth);

    if (operation.auth) {
      assert.deepEqual(openApiOperation.security, [{ bearerAuth: [] }]);
    } else {
      assert.equal("security" in openApiOperation, false);
    }

    const declaredVariants = operation.responseSchema.oneOf.map((variant) => variant.properties.outcome.const);
    const documentedVariants = openApiOperation.responses[200].content["application/json"].schema.oneOf
      .map((variant) => variant.properties.outcome.const);
    assert.deepEqual(documentedVariants, declaredVariants);
  }
});

test("OpenAPI JSON and Swagger UI are served by the domain engine", async () => {
  const openApi = await request("/api/openapi.json");
  assert.equal(openApi.status, 200);
  assert.deepEqual(openApi.body, openApiDocument());
  assert.equal(openApi.body.components.securitySchemes.bearerAuth.type, "http");
  assert.equal(openApi.body.paths["/api/workshops/{workshopId}"].get.responses[200].content["application/json"].schema.oneOf[0].properties.outcome.const, "alreadyRegistered");

  const docsResponse = await fetch(`${baseUrl}/api/docs`);
  assert.equal(docsResponse.status, 200);
  assert.match(docsResponse.headers.get("content-type"), /^text\/html/);
  const docs = await docsResponse.text();
  assert.match(docs, /SwaggerUIBundle/);
  assert.match(docs, /\/api\/openapi\.json/);
});

test("confirmation evaluates all four modeled outcomes and mutates only effectful branches", async () => {
  const before = store.getParticipation("participant-alex", "service-design-foundations");
  const alreadyConfirmed = await request("/api/workshops/service-design-foundations/registrations", {
    token: "token-alex",
    body: registration
  });
  assert.equal(alreadyConfirmed.body.outcome, "alreadyConfirmed");
  assert.deepEqual(store.getParticipation("participant-alex", "service-design-foundations"), before);

  const confirmed = await request("/api/workshops/service-design-foundations/registrations", {
    token: "token-blair",
    body: registration
  });
  assert.equal(confirmed.body.outcome, "confirmed");
  assert.equal(store.getParticipation("participant-blair", "service-design-foundations").status, "confirmed");

  const unavailable = await request("/api/workshops/facilitation-practice/registrations", {
    token: "token-blair",
    body: registration
  });
  assert.equal(unavailable.body.outcome, "waitlistOpen");
  assert.equal(store.getParticipation("participant-blair", "facilitation-practice"), undefined);

  const closed = await request("/api/workshops/research-operations/registrations", {
    token: "token-blair",
    body: registration
  });
  assert.equal(closed.body.outcome, "registrationClosed");
  assert.equal(store.getParticipation("participant-blair", "research-operations"), undefined);
});

test("confirmation can promote an existing waitlisted participant when a place is available", async () => {
  store.saveParticipation({
    participantId: "participant-blair",
    workshopId: "service-design-foundations",
    status: "waitlisted",
    name: "Blair Jensen",
    email: "blair@example.com",
    now: "2026-01-01T00:00:00.000Z"
  });

  const promoted = await request("/api/workshops/service-design-foundations/registrations", {
    token: "token-blair",
    body: registration
  });
  assert.equal(promoted.body.outcome, "confirmed");
  assert.equal(store.getParticipation("participant-blair", "service-design-foundations").status, "confirmed");
});

test("waitlist joining is idempotent and preserves closed as a no-effect outcome", async () => {
  const joined = await request("/api/workshops/facilitation-practice/waitlist", {
    token: "token-blair",
    body: waitlist
  });
  assert.equal(joined.body.outcome, "waitlisted");
  assert.equal(store.getParticipation("participant-blair", "facilitation-practice").status, "waitlisted");

  const repeated = await request("/api/workshops/facilitation-practice/waitlist", {
    token: "token-blair",
    body: waitlist
  });
  assert.equal(repeated.body.outcome, "alreadyWaitlisted");

  const closed = await request("/api/workshops/research-operations/waitlist", {
    token: "token-blair",
    body: waitlist
  });
  assert.equal(closed.body.outcome, "registrationClosed");
  assert.equal(store.getParticipation("participant-blair", "research-operations"), undefined);
});

test("offer identifiers locate while the authenticated subject authorizes", async () => {
  const unauthenticated = await request("/api/offers/offer-alex-open");
  assert.equal(unauthenticated.status, 401);

  const wrongSubject = await request("/api/offers/offer-alex-open", { token: "token-blair" });
  assert.equal(wrongSubject.status, 404);

  const ownOffer = await request("/api/offers/offer-alex-open", { token: "token-alex" });
  assert.equal(ownOffer.status, 200);
  assert.equal(ownOffer.body.outcome, "open");
});

test("offer expiry is materialized from current facts and persisted atomically", async () => {
  const expired = await request("/api/offers/offer-alex-expired", { token: "token-alex" });
  assert.equal(expired.body.outcome, "expired");
  assert.equal(store.getOffer("offer-alex-expired").status, "expired");

  const unavailable = await request("/api/offers/offer-alex-unavailable/accept", {
    token: "token-alex",
    method: "POST"
  });
  assert.equal(unavailable.body.outcome, "unavailable");
  assert.equal(store.getParticipation("participant-alex", "facilitation-practice").status, "waitlisted");
});

test("accepting an offer preserves subject/workshop continuity and is idempotent", async () => {
  const accepted = await request("/api/offers/offer-alex-open/accept", {
    token: "token-alex",
    method: "POST"
  });
  assert.equal(accepted.body.outcome, "accepted");
  assert.equal(store.getOffer("offer-alex-open").status, "accepted");
  assert.equal(store.getParticipation("participant-alex", "facilitation-practice").status, "confirmed");

  const repeated = await request("/api/offers/offer-alex-open/accept", {
    token: "token-alex",
    method: "POST"
  });
  assert.equal(repeated.body.outcome, "accepted");
});

test("declining an offer leaves the same participation waitlisted and is idempotent", async () => {
  const declined = await request("/api/offers/offer-alex-open/decline", {
    token: "token-alex",
    method: "POST"
  });
  assert.equal(declined.body.outcome, "declined");
  assert.equal(store.getOffer("offer-alex-open").status, "declined");
  assert.equal(store.getParticipation("participant-alex", "facilitation-practice").status, "waitlisted");

  const repeated = await request("/api/offers/offer-alex-open/decline", {
    token: "token-alex",
    method: "POST"
  });
  assert.equal(repeated.body.outcome, "declined");
});

test("conflicting stale offer commands cannot both mutate", async () => {
  const accepted = await request("/api/offers/offer-alex-open/accept", {
    token: "token-alex",
    method: "POST"
  });
  const staleDecline = await request("/api/offers/offer-alex-open/decline", {
    token: "token-alex",
    method: "POST"
  });
  assert.equal(accepted.status, 200);
  assert.equal(staleDecline.status, 409);
  assert.equal(store.getOffer("offer-alex-open").status, "accepted");
});

test("the HTTP boundary rejects malformed input without creating domain facts", async () => {
  const invalid = await request("/api/workshops/service-design-foundations/registrations", {
    token: "token-blair",
    body: { name: "Blair" }
  });
  assert.equal(invalid.status, 400);
  assert.equal(store.getParticipation("participant-blair", "service-design-foundations"), undefined);
});
