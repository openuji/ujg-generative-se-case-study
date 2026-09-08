import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { openDatabase, seedFixtures } from "../src/db.mjs";
import { createRequestHandler } from "../src/http.mjs";

async function withServer(run) {
  const db = openDatabase();
  seedFixtures(db);
  const server = http.createServer(createRequestHandler({ db }));
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await run({ baseUrl, db });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function extractCookie(response) {
  const raw = response.headers.get("set-cookie");
  return raw ? raw.split(";")[0] : undefined;
}

test("GET /openapi.json returns a document describing the real routes", async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/openapi.json`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(body.paths["/api/workshops"]);
    assert.ok(body.paths["/api/offers/{offerId}/accept"]);
  });
});

test("GET /docs serves the interactive documentation shell", async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/docs`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /swagger-ui-bundle\.js/);
  });
});

test("GET /api/workshops issues a participant cookie and lists teasers", async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/workshops`);
    assert.equal(response.status, 200);
    const cookie = extractCookie(response);
    assert.ok(cookie?.startsWith("participantId="));
    const workshops = await response.json();
    assert.ok(workshops.some((workshop) => workshop.id === "intro-to-ceramics"));
    for (const workshop of workshops) {
      assert.equal(Object.keys(workshop).sort().join(","), "date,id,location,summary,title");
    }
  });
});

test("a full registration walks through review to confirmation", async () => {
  await withServer(async ({ baseUrl }) => {
    const listResponse = await fetch(`${baseUrl}/api/workshops`);
    const cookie = extractCookie(listResponse);

    const detailResponse = await fetch(`${baseUrl}/api/workshops/intro-to-ceramics`, {
      headers: { cookie }
    });
    const detail = await detailResponse.json();
    assert.equal(detail.availability, "placeAvailable");
    assert.equal(detail.participantStatus, "none");

    const confirmResponse = await fetch(`${baseUrl}/api/workshops/intro-to-ceramics/registration`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ name: "Priya Shah", email: "priya@example.com", accessibilityNotes: "" })
    });
    const confirmed = await confirmResponse.json();
    assert.equal(confirmed.outcome, "confirmed");

    const repeatResponse = await fetch(`${baseUrl}/api/workshops/intro-to-ceramics/registration`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ name: "Priya Shah", email: "priya@example.com" })
    });
    const repeated = await repeatResponse.json();
    assert.equal(repeated.outcome, "alreadyRegistered");
  });
});

test("joining a full workshop's waitlist succeeds and reports registrationClosed for the closed workshop", async () => {
  await withServer(async ({ baseUrl }) => {
    const listResponse = await fetch(`${baseUrl}/api/workshops`);
    const cookie = extractCookie(listResponse);

    const waitlistResponse = await fetch(`${baseUrl}/api/workshops/data-storytelling/waitlist`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ name: "Jordan Lee", email: "jordan@example.com" })
    });
    assert.equal((await waitlistResponse.json()).outcome, "waitlisted");

    const closedResponse = await fetch(`${baseUrl}/api/workshops/effective-team-collaboration/waitlist`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ name: "Jordan Lee", email: "jordan@example.com" })
    });
    assert.equal((await closedResponse.json()).outcome, "registrationClosed");
  });
});

test("visiting an offer link adopts that offer's participant identity and can accept it", async () => {
  await withServer(async ({ baseUrl }) => {
    const offerResponse = await fetch(`${baseUrl}/api/offers/fixture-offer-open`);
    assert.equal(offerResponse.status, 200);
    const cookie = extractCookie(offerResponse);
    const offer = await offerResponse.json();
    assert.equal(offer.status, "open");

    const acceptResponse = await fetch(`${baseUrl}/api/offers/fixture-offer-open/accept`, {
      method: "POST",
      headers: { cookie }
    });
    assert.equal((await acceptResponse.json()).outcome, "confirmed");
  });
});

test("an expired offer cannot be accepted", async () => {
  await withServer(async ({ baseUrl }) => {
    const offerResponse = await fetch(`${baseUrl}/api/offers/fixture-offer-expired`);
    const cookie = extractCookie(offerResponse);
    const acceptResponse = await fetch(`${baseUrl}/api/offers/fixture-offer-expired/accept`, {
      method: "POST",
      headers: { cookie }
    });
    assert.equal((await acceptResponse.json()).outcome, "expired");
  });
});

test("an unknown workshop returns 404 rather than a business outcome", async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/workshops/does-not-exist`);
    assert.equal(response.status, 404);
  });
});
