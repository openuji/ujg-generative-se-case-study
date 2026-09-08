import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { openDatabase } from "../src/db.mjs";
import {
  availabilityOf,
  getWorkshopDetail,
  confirmRegistration,
  joinWaitlist,
  getOffer,
  acceptOffer,
  declineOffer
} from "../src/domain.mjs";

function seedWorkshop(db, overrides = {}) {
  const workshop = {
    id: randomUUID(),
    title: "Test Workshop",
    summary: "Summary",
    description: "Description",
    date: "2026-11-01T10:00:00Z",
    location: "Room 1",
    capacity: 2,
    registeredCount: 0,
    waitlistOpen: true,
    ...overrides
  };
  db.prepare(
    `INSERT INTO workshops (id, title, summary, description, date, location, capacity, registered_count, waitlist_open)
     VALUES (@id, @title, @summary, @description, @date, @location, @capacity, @registeredCount, @waitlistOpen)`
  ).run({ ...workshop, waitlistOpen: workshop.waitlistOpen ? 1 : 0 });
  return workshop;
}

test("availabilityOf branches on capacity and waitlist_open", () => {
  assert.equal(availabilityOf({ registered_count: 0, capacity: 5, waitlist_open: 1 }), "placeAvailable");
  assert.equal(availabilityOf({ registered_count: 5, capacity: 5, waitlist_open: 1 }), "waitlistOpen");
  assert.equal(availabilityOf({ registered_count: 5, capacity: 5, waitlist_open: 0 }), "registrationClosed");
});

test("getWorkshopDetail returns null for an unknown workshop", () => {
  const db = openDatabase();
  assert.equal(getWorkshopDetail(db, "missing", "participant-1"), null);
});

test("confirmRegistration confirms a place when one is available", () => {
  const db = openDatabase();
  const workshop = seedWorkshop(db, { capacity: 2, registeredCount: 0 });
  const result = confirmRegistration(db, workshop.id, "participant-1", { name: "Ada", email: "ada@example.com" });
  assert.equal(result.outcome, "confirmed");
  assert.equal(result.workshop.participantStatus, "confirmed");
  assert.equal(getWorkshopDetail(db, workshop.id, "someone-else").availability, "placeAvailable");
});

test("confirmRegistration is idempotent for a repeated command from the same participant", () => {
  const db = openDatabase();
  const workshop = seedWorkshop(db, { capacity: 2, registeredCount: 0 });
  const first = confirmRegistration(db, workshop.id, "participant-1", { name: "Ada", email: "ada@example.com" });
  const second = confirmRegistration(db, workshop.id, "participant-1", { name: "Ada", email: "ada@example.com" });
  assert.equal(first.outcome, "confirmed");
  assert.equal(second.outcome, "alreadyRegistered");
  // Capacity must not be double-consumed by the repeated command.
  assert.equal(getWorkshopDetail(db, workshop.id, "participant-2").availability, "placeAvailable");
});

test("confirmRegistration reports placeUnavailable when the workshop is full but waitlist is open", () => {
  const db = openDatabase();
  const workshop = seedWorkshop(db, { capacity: 1, registeredCount: 1, waitlistOpen: true });
  const result = confirmRegistration(db, workshop.id, "participant-1", { name: "Ada", email: "ada@example.com" });
  assert.equal(result.outcome, "placeUnavailable");
});

test("confirmRegistration reports registrationClosed when the workshop is full and waitlist is closed", () => {
  const db = openDatabase();
  const workshop = seedWorkshop(db, { capacity: 1, registeredCount: 1, waitlistOpen: false });
  const result = confirmRegistration(db, workshop.id, "participant-1", { name: "Ada", email: "ada@example.com" });
  assert.equal(result.outcome, "registrationClosed");
});

test("joinWaitlist joins, then reports alreadyWaitlisted on repeat", () => {
  const db = openDatabase();
  const workshop = seedWorkshop(db, { capacity: 1, registeredCount: 1, waitlistOpen: true });
  const first = joinWaitlist(db, workshop.id, "participant-1", { name: "Ada", email: "ada@example.com" });
  const second = joinWaitlist(db, workshop.id, "participant-1", { name: "Ada", email: "ada@example.com" });
  assert.equal(first.outcome, "waitlisted");
  assert.equal(second.outcome, "alreadyWaitlisted");
});

test("joinWaitlist reports registrationClosed when the waitlist itself is closed", () => {
  const db = openDatabase();
  const workshop = seedWorkshop(db, { capacity: 1, registeredCount: 1, waitlistOpen: false });
  const result = joinWaitlist(db, workshop.id, "participant-1", { name: "Ada", email: "ada@example.com" });
  assert.equal(result.outcome, "registrationClosed");
});

function seedOffer(db, { workshopOverrides = {}, expiresInMs = 1000 * 60 * 60 } = {}) {
  const workshop = seedWorkshop(db, { capacity: 5, registeredCount: 5, waitlistOpen: true, ...workshopOverrides });
  const participantId = randomUUID();
  db.prepare(`INSERT INTO participants (id, name, email) VALUES (?, ?, ?)`).run(participantId, "Grace", "grace@example.com");
  db.prepare(
    `INSERT INTO registrations (id, workshop_id, participant_id, status, created_at) VALUES (?, ?, ?, 'waitlisted', ?)`
  ).run(randomUUID(), workshop.id, participantId, new Date().toISOString());
  const offerId = randomUUID();
  db.prepare(
    `INSERT INTO offered_places (id, workshop_id, participant_id, status, expires_at, created_at) VALUES (?, ?, ?, 'open', ?, ?)`
  ).run(offerId, workshop.id, participantId, new Date(Date.now() + expiresInMs).toISOString(), new Date().toISOString());
  return { workshop, participantId, offerId };
}

test("acceptOffer confirms the participant and upgrades their waitlisted registration", () => {
  const db = openDatabase();
  const { workshop, participantId, offerId } = seedOffer(db);
  const result = acceptOffer(db, offerId, participantId);
  assert.equal(result.outcome, "confirmed");
  assert.equal(getWorkshopDetail(db, workshop.id, participantId).participantStatus, "confirmed");
});

test("acceptOffer reports expired for a past-due offer without mutating state", () => {
  const db = openDatabase();
  const { workshop, participantId, offerId } = seedOffer(db, { expiresInMs: -1000 });
  const result = acceptOffer(db, offerId, participantId);
  assert.equal(result.outcome, "expired");
  assert.equal(getWorkshopDetail(db, workshop.id, participantId).participantStatus, "waitlisted");
});

test("acceptOffer refuses a participant other than the one the offer names", () => {
  const db = openDatabase();
  const { offerId } = seedOffer(db);
  const result = acceptOffer(db, offerId, "someone-else");
  assert.equal(result.outcome, "unavailable");
});

test("acceptOffer is not reprocessed once already resolved (repeated command)", () => {
  const db = openDatabase();
  const { participantId, offerId } = seedOffer(db);
  const first = acceptOffer(db, offerId, participantId);
  const second = acceptOffer(db, offerId, participantId);
  assert.equal(first.outcome, "confirmed");
  assert.equal(second.outcome, "unavailable");
});

test("declineOffer leaves the participant waitlisted rather than confirmed", () => {
  const db = openDatabase();
  const { workshop, participantId, offerId } = seedOffer(db);
  const result = declineOffer(db, offerId, participantId);
  assert.equal(result.outcome, "waitlisted");
  assert.equal(getWorkshopDetail(db, workshop.id, participantId).participantStatus, "waitlisted");
});

test("declineOffer reports expired for a past-due offer", () => {
  const db = openDatabase();
  const { offerId, participantId } = seedOffer(db, { expiresInMs: -1000 });
  const result = declineOffer(db, offerId, participantId);
  assert.equal(result.outcome, "expired");
});

test("getOffer surfaces the effective expired status without a mutating command", () => {
  const db = openDatabase();
  const { offerId } = seedOffer(db, { expiresInMs: -1000 });
  assert.equal(getOffer(db, offerId).status, "expired");
});
