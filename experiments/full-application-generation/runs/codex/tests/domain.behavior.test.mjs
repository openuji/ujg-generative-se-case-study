import test from "node:test";
import assert from "node:assert/strict";
import { createWorkshopEngine } from "../apps/domain/src/main.mjs";

test("registration details validate before review", () => {
  const engine = createWorkshopEngine();
  assert.deepEqual(engine.validateRegistrationDetails({ name: "", email: "bad" }), {
    valid: false,
    errors: {
      name: "Enter your full name.",
      email: "Enter a valid email."
    }
  });
});

test("registration confirmation preserves every availability outcome", () => {
  const engine = createWorkshopEngine();
  assert.equal(engine.confirmRegistration("data-storytelling", { name: "Alex Morgan", email: "alex@example.com" }).outcome, "confirmed");
  assert.equal(engine.confirmRegistration("data-storytelling", { name: "Alex Morgan", email: "alex@example.com" }).outcome, "already-confirmed");
  assert.equal(engine.confirmRegistration("team-collaboration", { name: "Sam Lee", email: "sam@example.com" }).outcome, "place-unavailable");
  assert.equal(engine.confirmRegistration("closed-productivity", { name: "Riley Chen", email: "riley@example.com" }).outcome, "closed");
});

test("waitlist submission preserves open, already-listed, and closed outcomes", () => {
  const engine = createWorkshopEngine();
  assert.equal(engine.joinWaitlist("team-collaboration", { name: "Sam Lee", email: "sam@example.com" }).outcome, "waitlisted");
  assert.equal(engine.joinWaitlist("team-collaboration", { name: "Sam Lee", email: "sam@example.com" }).outcome, "already-waitlisted");
  assert.equal(engine.joinWaitlist("closed-productivity", { name: "Riley Chen", email: "riley@example.com" }).outcome, "closed");
});

test("offered-place acceptance enforces participant authority and terminal states", () => {
  const engine = createWorkshopEngine();
  assert.equal(engine.resolveOffer("offer-demo", "other@example.com", "accept").outcome, "not-authorized");
  assert.equal(engine.resolveOffer("offer-expired", "waitlisted@example.com", "accept").outcome, "expired");
  assert.equal(engine.resolveOffer("offer-unavailable", "waitlisted@example.com", "accept").outcome, "unavailable");
  assert.equal(engine.resolveOffer("offer-demo", "waitlisted@example.com", "accept").outcome, "accepted");
  assert.equal(engine.resolveOffer("offer-demo", "waitlisted@example.com", "accept").outcome, "accepted");
});

test("offered-place decline leaves the participant waitlisted", () => {
  const engine = createWorkshopEngine();
  assert.equal(engine.resolveOffer("offer-demo", "waitlisted@example.com", "decline").outcome, "declined");
  const state = engine.snapshot();
  assert.equal(state.participations.find((entry) => entry.participant_email === "waitlisted@example.com")?.status, "waitlisted");
});

test("fake email delivery exposes an offer continuation without mutating state", () => {
  const engine = createWorkshopEngine();
  const email = engine.renderOfferEmail("offer-demo");
  assert.equal(email.delivered, true);
  assert.equal(engine.snapshot().offers.find((entry) => entry.token === "offer-demo")?.status, "available");
});
