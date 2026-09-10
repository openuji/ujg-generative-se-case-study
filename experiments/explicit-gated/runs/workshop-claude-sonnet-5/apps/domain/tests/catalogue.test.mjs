/**
 * What a participant can reach before they do anything, and which of the five
 * situations a workshop's detail puts them in.
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { readWaitlistStanding, readWorkshopDetail, readWorkshopOverview } from "../src/domain/catalogue.mjs";
import { freshCatalogue, participants, workshops } from "./support/catalogue.mjs";

describe("browsing the catalogue", () => {
  let database;

  beforeEach(() => {
    database = freshCatalogue();
  });

  afterEach(() => {
    database.close();
  });

  it("lists every workshop as a teaser", () => {
    const overview = readWorkshopOverview(database);

    assert.equal(overview.length, 5);
    for (const entry of overview) {
      assert.equal(typeof entry.id, "string");
      assert.deepEqual(Object.keys(entry.teaser).sort(), ["date", "location", "summary", "title"]);
    }
  });

  it("has a workshop with exactly one place left, so the last place can run out", () => {
    const row = database.prepare("SELECT * FROM workshops WHERE id = ?").get(workshops.lastPlace);

    assert.equal(row.registration_availability, "placeAvailable");
    assert.equal(row.remaining_places, 1);
  });

  it("opens a workshop that is still taking registrations", () => {
    const detail = readWorkshopDetail(database, workshops.lastPlace, participants.grace);

    assert.equal(detail.outcome, "found");
    assert.equal(detail.view, "registrationOpen");
    assert.equal(detail.detail.availability, "1 place available");
    assert.equal(detail.notice, undefined);
  });

  it("opens a workshop that is only taking waitlist entries", () => {
    const detail = readWorkshopDetail(database, workshops.waitlistOpen, participants.ada);

    assert.equal(detail.view, "waitlistOpen");
    assert.equal(detail.detail.availability, "Fully booked — waitlist open");
  });

  it("opens a workshop that has stopped taking entries, with the reason to show", () => {
    const detail = readWorkshopDetail(database, workshops.closed, participants.ada);

    assert.equal(detail.view, "registrationClosed");
    assert.equal(detail.status.title, "Registration has closed");
    assert.equal(detail.status.tone, "warning");
  });

  it("tells a participant who already holds a place that they do", () => {
    const detail = readWorkshopDetail(database, workshops.roomy, participants.ada);

    assert.equal(detail.view, "alreadyRegistered");
    assert.equal(detail.notice.tone, "success");
    assert.match(detail.notice.message, /already have a place/);
  });

  it("tells a participant who is already on the waitlist that they are", () => {
    const detail = readWorkshopDetail(database, workshops.waitlistOpen, participants.grace);

    assert.equal(detail.view, "alreadyWaitlisted");
    assert.equal(detail.notice.tone, "info");
  });

  it("shows the same workshop differently to two different participants", () => {
    const forAda = readWorkshopDetail(database, workshops.roomy, participants.ada);
    const forGrace = readWorkshopDetail(database, workshops.roomy, participants.grace);

    assert.equal(forAda.view, "alreadyRegistered");
    assert.equal(forGrace.view, "registrationOpen");
  });

  it("shows the offered workshop's own availability to a signed-out visitor", () => {
    const detail = readWorkshopDetail(database, workshops.roomy, null);

    assert.equal(detail.view, "registrationOpen");
  });

  it("reports an unknown workshop rather than inventing one", () => {
    assert.equal(readWorkshopDetail(database, "workshop-nowhere", participants.ada).outcome, "unknownWorkshop");
  });
});

describe("a participant's standing on a waitlist", () => {
  let database;

  beforeEach(() => {
    database = freshCatalogue();
  });

  afterEach(() => {
    database.close();
  });

  it("carries a waitlisted participant on to their standing", () => {
    const standing = readWaitlistStanding(database, workshops.waitlistOpen, participants.grace);

    assert.equal(standing.outcome, "waitlisted");
    assert.equal(standing.status.title, "You are on the waitlist");
  });

  it("has nothing to show a participant who never joined", () => {
    assert.equal(readWaitlistStanding(database, workshops.waitlistOpen, participants.ada).outcome, "notWaitlisted");
  });

  it("has nothing to show for a workshop that does not exist", () => {
    assert.equal(readWaitlistStanding(database, "workshop-nowhere", participants.ada).outcome, "unknownWorkshop");
  });
});
