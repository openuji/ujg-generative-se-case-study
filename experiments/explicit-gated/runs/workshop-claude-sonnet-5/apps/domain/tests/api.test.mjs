/**
 * The service over the wire: the routes each part of the product needs, who is
 * allowed to call them, what a body has to look like to be accepted, and the
 * description the service publishes of itself.
 */

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { offers, participants, workshops } from "./support/catalogue.mjs";
import { startTestService } from "./support/service.mjs";

describe("signing in over the wire", () => {
  let service;

  before(async () => {
    service = await startTestService();
  });

  after(async () => {
    await service.close();
  });

  it("publishes the participants a caller may sign in as", async () => {
    const answer = await service.call("GET", "/api/participants");

    assert.equal(answer.status, 200);
    assert.equal(answer.body.participants.length, 5);
  });

  it("hands back a token and the participant it belongs to", async () => {
    const answer = await service.call("POST", "/api/sessions", { body: { participantId: participants.grace } });

    assert.equal(answer.status, 201);
    assert.equal(answer.body.participant.name, "Grace Hopper");
    assert.equal(typeof answer.body.token, "string");
  });

  it("refuses to sign in as somebody who is not there", async () => {
    const answer = await service.call("POST", "/api/sessions", { body: { participantId: "participant-nobody" } });

    assert.equal(answer.status, 404);
  });

  it("refuses a sign-in body that does not match the route's contract", async () => {
    const answer = await service.call("POST", "/api/sessions", { body: { who: participants.grace } });

    assert.equal(answer.status, 400);
    assert.ok(answer.body.problems.length > 0);
  });

  it("reports the signed-in participant back", async () => {
    const token = await service.signIn(participants.alan);
    const answer = await service.call("GET", "/api/sessions/current", { token });

    assert.equal(answer.body.participant.id, participants.alan);
  });

  it("stops answering once the session is ended", async () => {
    const token = await service.signIn(participants.alan);

    assert.equal((await service.call("DELETE", "/api/sessions/current", { token })).status, 204);
    assert.equal((await service.call("GET", "/api/sessions/current", { token })).status, 401);
  });
});

describe("requests that need a participant", () => {
  let service;

  before(async () => {
    service = await startTestService();
  });

  after(async () => {
    await service.close();
  });

  const guarded = [
    ["GET", "/api/sessions/current"],
    ["GET", `/api/workshops/${workshops.roomy}/waitlist`],
    ["POST", `/api/workshops/${workshops.roomy}/registration`],
    ["POST", `/api/workshops/${workshops.roomy}/registration/review`],
    ["POST", `/api/workshops/${workshops.waitlistOpen}/waitlist`],
    ["POST", `/api/workshops/${workshops.waitlistOpen}/waitlist/review`],
    ["GET", "/api/offers"],
    ["GET", `/api/offers/${offers.waiting}`],
    ["POST", `/api/offers/${offers.waiting}/accept`],
    ["POST", `/api/offers/${offers.waiting}/decline`],
    ["GET", `/api/offers/${offers.waiting}/message`],
    ["GET", "/api/mailbox"]
  ];

  for (const [method, route] of guarded) {
    it(`turns away ${method} ${route} with nobody signed in`, async () => {
      const answer = await service.call(method, route, { body: method === "POST" ? {} : undefined });

      assert.equal(answer.status, 401);
    });
  }

  it("does not need a participant to browse", async () => {
    assert.equal((await service.call("GET", "/api/workshops")).status, 200);
    assert.equal((await service.call("GET", `/api/workshops/${workshops.roomy}`)).status, 200);
  });

  it("turns away a token it never issued", async () => {
    const answer = await service.call("GET", "/api/offers", { token: "not-a-token" });

    assert.equal(answer.status, 401);
  });
});

describe("browsing and booking over the wire", () => {
  let service;
  let grace;

  before(async () => {
    service = await startTestService();
    grace = await service.signIn(participants.grace);
  });

  after(async () => {
    await service.close();
  });

  it("lists the workshops", async () => {
    const answer = await service.call("GET", "/api/workshops");

    assert.equal(answer.body.workshops.length, 5);
  });

  it("opens a workshop in the situation this participant is in", async () => {
    const forGrace = await service.call("GET", `/api/workshops/${workshops.roomy}`, { token: grace });
    const forNobody = await service.call("GET", `/api/workshops/${workshops.roomy}`);

    assert.equal(forGrace.body.view, "registrationOpen");
    assert.equal(forNobody.body.view, "registrationOpen");

    const ada = await service.signIn(participants.ada);
    const forAda = await service.call("GET", `/api/workshops/${workshops.roomy}`, { token: ada });
    assert.equal(forAda.body.view, "alreadyRegistered");
  });

  it("reports a workshop that is not there", async () => {
    assert.equal((await service.call("GET", "/api/workshops/workshop-nowhere")).status, 404);
  });

  it("walks a booking through checking, reviewing and confirming", async () => {
    const details = { name: "Grace Hopper", email: "grace@workshops.example" };

    const review = await service.call("POST", `/api/workshops/${workshops.roomy}/registration/review`, {
      token: grace,
      body: details
    });
    assert.equal(review.status, 200);
    assert.equal(review.body.review.workshopTitle, "Design Tokens in Practice");

    const confirmed = await service.call("POST", `/api/workshops/${workshops.roomy}/registration`, {
      token: grace,
      body: details
    });
    assert.equal(confirmed.status, 200);
    assert.equal(confirmed.body.outcome, "confirmed");

    const again = await service.call("POST", `/api/workshops/${workshops.roomy}/registration`, {
      token: grace,
      body: details
    });
    assert.equal(again.status, 200);
    assert.equal(again.body.outcome, "alreadyConfirmed");
  });

  it("answers details that cannot be acted on with the same form", async () => {
    const answer = await service.call("POST", `/api/workshops/${workshops.lastPlace}/registration/review`, {
      token: grace,
      body: { name: "", email: "nope" }
    });

    assert.equal(answer.status, 422);
    assert.equal(answer.body.outcome, "invalidDetails");
    assert.deepEqual(Object.keys(answer.body.form.errors).sort(), ["email", "name"]);
  });

  it("refuses a body carrying a field the form contract does not have", async () => {
    const answer = await service.call("POST", `/api/workshops/${workshops.lastPlace}/registration/review`, {
      token: grace,
      body: { name: "Grace Hopper", email: "grace@workshops.example", nickname: "Amazing Grace" }
    });

    assert.equal(answer.status, 400);
    assert.equal(answer.body.problems[0].pointer, "/nickname");
  });

  it("refuses a body that is not JSON at all", async () => {
    const response = await fetch(`${service.origin}/api/workshops/${workshops.lastPlace}/registration/review`, {
      method: "POST",
      headers: { authorization: `Bearer ${grace}`, "content-type": "application/json" },
      body: "not json"
    });

    assert.equal(response.status, 400);
  });

  it("answers a workshop that stopped taking entries with the reason", async () => {
    const answer = await service.call("POST", `/api/workshops/${workshops.closed}/registration`, {
      token: grace,
      body: { name: "Grace Hopper", email: "grace@workshops.example" }
    });

    assert.equal(answer.status, 409);
    assert.equal(answer.body.outcome, "registrationClosed");
  });

  it("answers a place that has gone with the workshop's current detail", async () => {
    const details = { name: "Grace Hopper", email: "grace@workshops.example" };
    const first = await service.call("POST", `/api/workshops/${workshops.lastPlace}/registration`, {
      token: grace,
      body: details
    });
    assert.equal(first.body.outcome, "confirmed");

    const alan = await service.signIn(participants.alan);
    const second = await service.call("POST", `/api/workshops/${workshops.lastPlace}/registration`, {
      token: alan,
      body: { name: "Alan Turing", email: "alan@workshops.example" }
    });

    assert.equal(second.status, 409);
    assert.equal(second.body.outcome, "placeUnavailable");
    assert.equal(second.body.detail.availability, "Fully booked — waitlist open");
  });
});

describe("the waitlist over the wire", () => {
  let service;
  let alan;

  before(async () => {
    service = await startTestService();
    alan = await service.signIn(participants.alan);
  });

  after(async () => {
    await service.close();
  });

  it("walks an entry through checking, reviewing and joining", async () => {
    const details = { name: "Alan Turing", email: "alan@workshops.example" };

    const review = await service.call("POST", `/api/workshops/${workshops.waitlistOpen}/waitlist/review`, {
      token: alan,
      body: details
    });
    assert.equal(review.body.review.workshopTitle, "Service Design Studio");

    const joined = await service.call("POST", `/api/workshops/${workshops.waitlistOpen}/waitlist`, {
      token: alan,
      body: details
    });
    assert.equal(joined.body.outcome, "waitlisted");
  });

  it("carries a participant already on the list on to their standing", async () => {
    const grace = await service.signIn(participants.grace);
    const joined = await service.call("POST", `/api/workshops/${workshops.waitlistOpen}/waitlist`, {
      token: grace,
      body: { name: "Grace Hopper", email: "grace@workshops.example" }
    });
    assert.equal(joined.body.outcome, "alreadyWaitlisted");

    const standing = await service.call("GET", `/api/workshops/${workshops.waitlistOpen}/waitlist`, {
      token: grace
    });
    assert.equal(standing.status, 200);
    assert.equal(standing.body.status.title, "You are on the waitlist");
  });

  it("has no standing to show a participant who never joined", async () => {
    const mary = await service.signIn(participants.mary);
    const standing = await service.call("GET", `/api/workshops/${workshops.waitlistOpen}/waitlist`, {
      token: mary
    });

    assert.equal(standing.status, 404);
  });
});

describe("offered places over the wire", () => {
  let service;

  before(async () => {
    service = await startTestService();
  });

  after(async () => {
    await service.close();
  });

  it("lists only the offers made to the participant asking", async () => {
    const grace = await service.signIn(participants.grace);
    const answer = await service.call("GET", "/api/offers", { token: grace });

    assert.deepEqual(answer.body.offers.map((offer) => offer.id), [offers.waiting]);
  });

  it("opens an offer that is still waiting", async () => {
    const grace = await service.signIn(participants.grace);
    const answer = await service.call("GET", `/api/offers/${offers.waiting}`, { token: grace });

    assert.equal(answer.status, 200);
    assert.equal(answer.body.view, "available");
    assert.equal(answer.body.offer.workshopTitle, "Inclusive Copywriting");
  });

  it("turns away a participant the place was not offered to", async () => {
    const alan = await service.signIn(participants.alan);

    assert.equal((await service.call("GET", `/api/offers/${offers.waiting}`, { token: alan })).status, 403);
    assert.equal((await service.call("POST", `/api/offers/${offers.waiting}/accept`, { token: alan })).status, 403);
    assert.equal((await service.call("POST", `/api/offers/${offers.waiting}/decline`, { token: alan })).status, 403);
  });

  it("reports an offer that is not there", async () => {
    const grace = await service.signIn(participants.grace);

    assert.equal((await service.call("GET", "/api/offers/offer-nowhere", { token: grace })).status, 404);
    assert.equal((await service.call("POST", "/api/offers/offer-nowhere/accept", { token: grace })).status, 404);
  });

  it("answers an offer that ran out with the reason, not with the place", async () => {
    const alan = await service.signIn(participants.alan);
    const answer = await service.call("POST", `/api/offers/${offers.passedDeadline}/accept`, { token: alan });

    assert.equal(answer.status, 409);
    assert.equal(answer.body.outcome, "expired");
  });

  it("answers a withdrawn place with the reason", async () => {
    const katherine = await service.signIn(participants.katherine);
    const answer = await service.call("POST", `/api/offers/${offers.withdrawn}/decline`, { token: katherine });

    assert.equal(answer.status, 409);
    assert.equal(answer.body.outcome, "unavailable");
  });

  it("takes a place, and says so again on a repeat", async () => {
    const grace = await service.signIn(participants.grace);
    const taken = await service.call("POST", `/api/offers/${offers.waiting}/accept`, { token: grace });

    assert.equal(taken.status, 200);
    assert.equal(taken.body.outcome, "accepted");
    assert.equal(taken.body.effectApplied, true);

    const repeated = await service.call("POST", `/api/offers/${offers.waiting}/accept`, { token: grace });
    assert.equal(repeated.body.outcome, "alreadyAccepted");
    assert.equal(repeated.body.effectApplied, false);

    const workshop = await service.call("GET", `/api/workshops/${workshops.offering}`, { token: grace });
    assert.equal(workshop.body.view, "alreadyRegistered");
  });

  it("passes a place on, leaving the waitlist standing in place", async () => {
    const fresh = await startTestService();
    try {
      const grace = await fresh.signIn(participants.grace);
      const passed = await fresh.call("POST", `/api/offers/${offers.waiting}/decline`, { token: grace });

      assert.equal(passed.body.outcome, "declined");
      const workshop = await fresh.call("GET", `/api/workshops/${workshops.offering}`, { token: grace });
      assert.equal(workshop.body.view, "alreadyWaitlisted");
    } finally {
      await fresh.close();
    }
  });
});

describe("the message about an offered place", () => {
  let service;

  before(async () => {
    service = await startTestService({ appBaseUrl: "https://workshops.example/app" });
  });

  after(async () => {
    await service.close();
  });

  it("renders the product's own offer message and records it as delivered", async () => {
    const grace = await service.signIn(participants.grace);
    const answer = await service.call("GET", `/api/offers/${offers.waiting}/message`, { token: grace });

    assert.equal(answer.status, 200);
    assert.equal(answer.body.to, "grace@workshops.example");
    assert.match(answer.body.subject, /Inclusive Copywriting/);
    assert.match(answer.body.html, /^<!doctype html>/);
    assert.match(answer.body.html, /A place has opened up/);
    assert.match(answer.body.html, /Inclusive Copywriting/);
    assert.match(answer.body.html, /<a class="[^"]*" href="https:\/\/workshops\.example\/app\/#\/offers\/offer-grace-inclusive-copy">Open the offer<\/a>/);
  });

  it("carries exactly the fields its published description declares", async () => {
    const grace = await service.signIn(participants.grace);
    const answer = await service.call("GET", `/api/offers/${offers.waiting}/message`, { token: grace });
    const described = await service.call("GET", "/api/openapi.json");
    const schema =
      described.body.paths["/api/offers/{offeredPlaceId}/message"].get.responses["200"].content[
        "application/json"
      ].schema;

    assert.deepEqual(Object.keys(answer.body).sort(), Object.keys(schema.properties).sort());
    assert.equal(schema.additionalProperties, false);
  });

  it("puts it in the participant's own mailbox and nobody else's", async () => {
    const grace = await service.signIn(participants.grace);
    await service.call("GET", `/api/offers/${offers.waiting}/message`, { token: grace });

    const hers = await service.call("GET", "/api/mailbox", { token: grace });
    assert.ok(hers.body.messages.length >= 1);
    assert.match(hers.body.messages[0].subject, /Inclusive Copywriting/);

    const alan = await service.signIn(participants.alan);
    const his = await service.call("GET", "/api/mailbox", { token: alan });
    assert.deepEqual(his.body.messages, []);
  });

  it("will not render a message about somebody else's offer", async () => {
    const alan = await service.signIn(participants.alan);
    const answer = await service.call("GET", `/api/offers/${offers.waiting}/message`, { token: alan });

    assert.equal(answer.status, 403);
  });

  it("has no message to send about an offer that is no longer waiting", async () => {
    const ada = await service.signIn(participants.ada);
    const answer = await service.call("GET", `/api/offers/${offers.taken}/message`, { token: ada });

    assert.equal(answer.status, 409);
    assert.equal(answer.body.outcome, "alreadyAccepted");
  });
});

describe("the description the service publishes of itself", () => {
  let service;

  before(async () => {
    service = await startTestService();
  });

  after(async () => {
    await service.close();
  });

  it("serves a description built from the routes it dispatches", async () => {
    const answer = await service.call("GET", "/api/openapi.json");

    assert.equal(answer.status, 200);
    assert.equal(answer.body.openapi, "3.1.0");
    for (const route of service.service.routes) {
      const operation = answer.body.paths[route.path]?.[route.method.toLowerCase()];
      assert.ok(operation !== undefined, `${route.method} ${route.path} is described`);
      assert.equal(operation.operationId, route.operationId);
    }
  });

  it("uses the product's own data contracts as its component schemas", async () => {
    const answer = await service.call("GET", "/api/openapi.json");
    const schemas = answer.body.components.schemas;

    assert.deepEqual(Object.keys(schemas).sort(), [
      "OfferSummary",
      "RegistrationForm",
      "RegistrationReview",
      "StatusMessage",
      "StatusNotice",
      "WaitlistForm",
      "WaitlistReview",
      "WorkshopDetail",
      "WorkshopTeaser"
    ]);
    assert.deepEqual(schemas.WorkshopTeaser.required, ["title", "summary", "date", "location"]);
    assert.equal(schemas.WorkshopTeaser.$id, undefined);
    assert.equal(schemas.WorkshopTeaser.$schema, undefined);
  });

  it("says which routes need a signed-in participant", async () => {
    const answer = await service.call("GET", "/api/openapi.json");

    assert.deepEqual(answer.body.paths["/api/offers/{offeredPlaceId}/accept"].post.security, [
      { participantSession: [] }
    ]);
    assert.deepEqual(answer.body.paths["/api/workshops"].get.security, []);
  });

  it("serves a page to read the description in", async () => {
    const answer = await service.call("GET", "/api/docs");

    assert.equal(answer.status, 200);
    assert.match(answer.headers.get("content-type"), /text\/html/);
    assert.match(answer.text, /swagger-ui/);
    assert.match(answer.text, /\/api\/openapi\.json/);
  });
});

describe("addresses the service does not answer", () => {
  let service;

  before(async () => {
    service = await startTestService();
  });

  after(async () => {
    await service.close();
  });

  it("reports nothing at an unknown address", async () => {
    assert.equal((await service.call("GET", "/api/nothing-here")).status, 404);
  });

  it("says which methods an address does answer", async () => {
    const answer = await service.call("DELETE", "/api/workshops");

    assert.equal(answer.status, 405);
    assert.equal(answer.headers.get("allow"), "GET");
  });

  it("answers a preflight request", async () => {
    const answer = await service.call("OPTIONS", "/api/workshops");

    assert.equal(answer.status, 204);
  });
});
