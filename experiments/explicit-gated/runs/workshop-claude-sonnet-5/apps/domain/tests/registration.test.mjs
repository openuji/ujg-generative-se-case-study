/**
 * Booking a place: every outcome the product distinguishes, what each one does
 * to the catalogue, and what a repeat of the same booking does.
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { confirmRegistration, reviewRegistrationDetails } from "../src/domain/registration.mjs";
import {
  freshCatalogue,
  goodDetails,
  participants,
  readParticipationRow,
  readWorkshopRow,
  shortlyAfter,
  workshops
} from "./support/catalogue.mjs";

describe("checking registration details before booking", () => {
  let database;

  beforeEach(() => {
    database = freshCatalogue();
  });

  afterEach(() => {
    database.close();
  });

  it("turns details that hold up into the summary to review", () => {
    const result = reviewRegistrationDetails({
      database,
      workshopId: workshops.lastPlace,
      submitted: goodDetails
    });

    assert.equal(result.outcome, "ready");
    assert.deepEqual(result.review, {
      workshopTitle: "Accessible Forms",
      name: "Grace Hopper",
      email: "grace@workshops.example"
    });
  });

  it("names the workshop from the catalogue, not from the submission", () => {
    const result = reviewRegistrationDetails({
      database,
      workshopId: workshops.roomy,
      submitted: goodDetails
    });

    assert.equal(result.review.workshopTitle, "Design Tokens in Practice");
  });

  it("returns the same form with a message per field at fault", () => {
    const result = reviewRegistrationDetails({
      database,
      workshopId: workshops.lastPlace,
      submitted: { name: "  ", email: "grace-at-example", accessibilityNotes: "x" }
    });

    assert.equal(result.outcome, "invalidDetails");
    assert.deepEqual(Object.keys(result.form.errors).sort(), ["email", "name"]);
    assert.equal(result.form.accessibilityNotes, "x");
  });

  it("records nothing while details are only being checked", () => {
    reviewRegistrationDetails({ database, workshopId: workshops.lastPlace, submitted: goodDetails });

    assert.equal(readParticipationRow(database, workshops.lastPlace, participants.grace), undefined);
    assert.equal(readWorkshopRow(database, workshops.lastPlace).remaining_places, 1);
  });

  it("has nothing to check against for a workshop that does not exist", () => {
    const result = reviewRegistrationDetails({
      database,
      workshopId: "workshop-nowhere",
      submitted: goodDetails
    });

    assert.equal(result.outcome, "unknownWorkshop");
  });
});

describe("booking a place", () => {
  let database;

  const book = (workshopId, participantId, submitted = goodDetails) =>
    confirmRegistration({ database, workshopId, participantId, submitted, now: shortlyAfter });

  beforeEach(() => {
    database = freshCatalogue();
  });

  afterEach(() => {
    database.close();
  });

  it("books the place and takes it off the workshop", () => {
    const result = book(workshops.roomy, participants.grace);

    assert.equal(result.outcome, "confirmed");
    assert.equal(result.effectApplied, true);
    assert.equal(result.status.title, "Your place is booked");
    assert.equal(result.status.tone, "success");
    assert.equal(readParticipationRow(database, workshops.roomy, participants.grace).participation_status, "confirmed");
    assert.equal(readWorkshopRow(database, workshops.roomy).remaining_places, 7);
  });

  it("closes registration on the workshop whose last place it took", () => {
    assert.equal(book(workshops.lastPlace, participants.grace).outcome, "confirmed");

    const workshop = readWorkshopRow(database, workshops.lastPlace);
    assert.equal(workshop.remaining_places, 0);
    assert.equal(workshop.registration_availability, "waitlistOpen");
  });

  it("changes nothing when the participant already holds a place", () => {
    const before = readWorkshopRow(database, workshops.roomy).remaining_places;
    const result = book(workshops.roomy, participants.ada);

    assert.equal(result.outcome, "alreadyConfirmed");
    assert.equal(result.effectApplied, false);
    assert.equal(result.status.title, "You are already registered");
    assert.equal(readWorkshopRow(database, workshops.roomy).remaining_places, before);
  });

  it("answers a repeat of the same booking the same way, without booking twice", () => {
    assert.equal(book(workshops.roomy, participants.grace).outcome, "confirmed");
    const repeated = book(workshops.roomy, participants.grace);

    assert.equal(repeated.outcome, "alreadyConfirmed");
    assert.equal(repeated.effectApplied, false);
    assert.equal(readWorkshopRow(database, workshops.roomy).remaining_places, 7);
  });

  it("reports the place as gone once the last one has been taken", () => {
    assert.equal(book(workshops.lastPlace, participants.grace).outcome, "confirmed");
    const result = book(workshops.lastPlace, participants.alan);

    assert.equal(result.outcome, "placeUnavailable");
    assert.equal(result.effectApplied, false);
    assert.equal(result.detail.availability, "Fully booked — waitlist open");
    assert.equal(readParticipationRow(database, workshops.lastPlace, participants.alan), undefined);
  });

  it("reports that the workshop has stopped taking entries", () => {
    const result = book(workshops.closed, participants.grace);

    assert.equal(result.outcome, "registrationClosed");
    assert.equal(result.effectApplied, false);
    assert.equal(result.status.tone, "warning");
    assert.equal(readParticipationRow(database, workshops.closed, participants.grace), undefined);
  });

  it("reports the place as gone on a workshop that only takes waitlist entries", () => {
    const result = book(workshops.waitlistOpen, participants.ada);

    assert.equal(result.outcome, "placeUnavailable");
    assert.equal(readParticipationRow(database, workshops.waitlistOpen, participants.ada), undefined);
  });

  it("refuses details that cannot be acted on, and books nothing", () => {
    const result = book(workshops.roomy, participants.grace, { name: "Grace Hopper", email: "" });

    assert.equal(result.outcome, "invalidDetails");
    assert.equal(result.form.errors.email, "Enter an email address we can send confirmations to.");
    assert.equal(readParticipationRow(database, workshops.roomy, participants.grace), undefined);
    assert.equal(readWorkshopRow(database, workshops.roomy).remaining_places, 8);
  });

  it("refuses notes longer than the form accepts", () => {
    const result = book(workshops.roomy, participants.grace, {
      ...goodDetails,
      accessibilityNotes: "n".repeat(501)
    });

    assert.equal(result.outcome, "invalidDetails");
    assert.equal(result.form.errors.accessibilityNotes, "Use 500 characters or fewer.");
  });

  it("books for the participant who asked, and nobody else", () => {
    book(workshops.roomy, participants.grace);

    assert.equal(readParticipationRow(database, workshops.roomy, participants.grace).participation_status, "confirmed");
    assert.equal(readParticipationRow(database, workshops.roomy, participants.alan), undefined);
  });

  it("keeps the submitted details with the booking", () => {
    book(workshops.roomy, participants.grace);
    const participation = readParticipationRow(database, workshops.roomy, participants.grace);

    assert.equal(participation.name, "Grace Hopper");
    assert.equal(participation.email, "grace@workshops.example");
    assert.equal(participation.notes, "Step-free access, please.");
    assert.equal(participation.recorded_at, shortlyAfter.toISOString());
  });

  it("reports an unknown workshop rather than booking anything", () => {
    assert.equal(book("workshop-nowhere", participants.grace).outcome, "unknownWorkshop");
  });

  it("moves a waitlisted participant on to a booked place when one is free", () => {
    const result = book(workshops.roomy, participants.grace);
    assert.equal(result.outcome, "confirmed");

    const promoted = confirmRegistration({
      database,
      workshopId: workshops.roomy,
      participantId: participants.alan,
      submitted: { name: "Alan Turing", email: "alan@workshops.example" },
      now: shortlyAfter
    });
    assert.equal(promoted.outcome, "confirmed");
    assert.equal(readWorkshopRow(database, workshops.roomy).remaining_places, 6);
  });
});
