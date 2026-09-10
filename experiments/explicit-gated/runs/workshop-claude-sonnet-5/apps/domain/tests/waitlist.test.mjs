/**
 * Joining a waitlist: every outcome the product distinguishes, and what a
 * repeat of the same entry does to a position already held.
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { confirmRegistration } from "../src/domain/registration.mjs";
import { joinWaitlist, reviewWaitlistDetails } from "../src/domain/waitlist.mjs";
import {
  freshCatalogue,
  goodWaitlistDetails,
  participants,
  readParticipationRow,
  readWorkshopRow,
  shortlyAfter,
  workshops
} from "./support/catalogue.mjs";

describe("checking waitlist details before joining", () => {
  let database;

  beforeEach(() => {
    database = freshCatalogue();
  });

  afterEach(() => {
    database.close();
  });

  it("turns details that hold up into the summary to review", () => {
    const result = reviewWaitlistDetails({
      database,
      workshopId: workshops.waitlistOpen,
      submitted: goodWaitlistDetails
    });

    assert.equal(result.outcome, "ready");
    assert.deepEqual(result.review, {
      workshopTitle: "Service Design Studio",
      name: "Alan Turing",
      email: "alan@workshops.example"
    });
  });

  it("returns the same form with a message per field at fault", () => {
    const result = reviewWaitlistDetails({
      database,
      workshopId: workshops.waitlistOpen,
      submitted: { name: "", email: "alan@workshops.example", notes: "n".repeat(501) }
    });

    assert.equal(result.outcome, "invalidDetails");
    assert.deepEqual(Object.keys(result.form.errors).sort(), ["name", "notes"]);
  });

  it("records nothing while details are only being checked", () => {
    reviewWaitlistDetails({ database, workshopId: workshops.waitlistOpen, submitted: goodWaitlistDetails });

    assert.equal(readParticipationRow(database, workshops.waitlistOpen, participants.alan), undefined);
  });

  it("has nothing to check against for a workshop that does not exist", () => {
    const result = reviewWaitlistDetails({
      database,
      workshopId: "workshop-nowhere",
      submitted: goodWaitlistDetails
    });

    assert.equal(result.outcome, "unknownWorkshop");
  });
});

describe("joining a waitlist", () => {
  let database;

  const join = (workshopId, participantId, submitted = goodWaitlistDetails) =>
    joinWaitlist({ database, workshopId, participantId, submitted, now: shortlyAfter });

  beforeEach(() => {
    database = freshCatalogue();
  });

  afterEach(() => {
    database.close();
  });

  it("records the entry on a workshop that is taking them", () => {
    const result = join(workshops.waitlistOpen, participants.alan);

    assert.equal(result.outcome, "waitlisted");
    assert.equal(result.effectApplied, true);
    assert.equal(result.status.title, "You are on the waitlist");
    assert.equal(
      readParticipationRow(database, workshops.waitlistOpen, participants.alan).participation_status,
      "waitlisted"
    );
  });

  it("leaves a position already held exactly as it was", () => {
    const before = readParticipationRow(database, workshops.waitlistOpen, participants.grace);
    const result = join(workshops.waitlistOpen, participants.grace);

    assert.equal(result.outcome, "alreadyWaitlisted");
    assert.equal(result.effectApplied, false);
    assert.equal(result.status.title, "You are already on the waitlist");
    assert.deepEqual(readParticipationRow(database, workshops.waitlistOpen, participants.grace), before);
  });

  it("answers a repeat of the same entry the same way", () => {
    assert.equal(join(workshops.waitlistOpen, participants.alan).outcome, "waitlisted");
    const recorded = readParticipationRow(database, workshops.waitlistOpen, participants.alan);

    assert.equal(join(workshops.waitlistOpen, participants.alan).outcome, "alreadyWaitlisted");
    assert.deepEqual(readParticipationRow(database, workshops.waitlistOpen, participants.alan), recorded);
  });

  it("reports that the workshop has stopped taking entries", () => {
    const result = join(workshops.closed, participants.alan);

    assert.equal(result.outcome, "registrationClosed");
    assert.equal(result.effectApplied, false);
    assert.equal(readParticipationRow(database, workshops.closed, participants.alan), undefined);
  });

  it("has no waitlist to join while the workshop still has places", () => {
    const result = join(workshops.roomy, participants.alan);

    assert.equal(result.outcome, "unsupported");
    assert.equal(result.effectApplied, false);
    assert.equal(readParticipationRow(database, workshops.roomy, participants.alan), undefined);
  });

  it("will not quietly replace a place already booked with a waitlist entry", () => {
    confirmRegistration({
      database,
      workshopId: workshops.roomy,
      participantId: participants.grace,
      submitted: { name: "Grace Hopper", email: "grace@workshops.example" },
      now: shortlyAfter
    });

    const result = join(workshops.roomy, participants.grace);

    assert.equal(result.outcome, "unsupported");
    assert.equal(
      readParticipationRow(database, workshops.roomy, participants.grace).participation_status,
      "confirmed"
    );
  });

  it("refuses details that cannot be acted on, and records nothing", () => {
    const result = join(workshops.waitlistOpen, participants.alan, { name: "Alan Turing", email: "nope" });

    assert.equal(result.outcome, "invalidDetails");
    assert.equal(result.form.errors.email, "Enter an email address in the form name@example.com.");
    assert.equal(readParticipationRow(database, workshops.waitlistOpen, participants.alan), undefined);
  });

  it("joins for the participant who asked, and nobody else", () => {
    join(workshops.waitlistOpen, participants.alan);

    assert.equal(readParticipationRow(database, workshops.waitlistOpen, participants.katherine), undefined);
  });

  it("does not touch how many places the workshop has", () => {
    const before = readWorkshopRow(database, workshops.waitlistOpen);
    join(workshops.waitlistOpen, participants.alan);

    assert.deepEqual(readWorkshopRow(database, workshops.waitlistOpen), before);
  });

  it("reports an unknown workshop rather than recording anything", () => {
    assert.equal(join("workshop-nowhere", participants.alan).outcome, "unknownWorkshop");
  });

  it("takes a waitlist entry on a workshop whose last place has just gone", () => {
    confirmRegistration({
      database,
      workshopId: workshops.lastPlace,
      participantId: participants.grace,
      submitted: { name: "Grace Hopper", email: "grace@workshops.example" },
      now: shortlyAfter
    });

    const result = join(workshops.lastPlace, participants.alan);

    assert.equal(result.outcome, "waitlisted");
    assert.equal(
      readParticipationRow(database, workshops.lastPlace, participants.alan).participation_status,
      "waitlisted"
    );
  });
});
