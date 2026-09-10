/**
 * Every document the service hands out is one of the product's authored
 * shapes, checked against the authored contract itself rather than against a
 * second description of it.
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { checkAgainstContract, conformsToContract, loadDataContracts } from "../src/dataContracts.mjs";
import { readWaitlistStanding, readWorkshopDetail, readWorkshopOverview } from "../src/domain/catalogue.mjs";
import { readOfferedPlace, respondToOfferedPlace } from "../src/domain/offeredPlace.mjs";
import { confirmRegistration, reviewRegistrationDetails } from "../src/domain/registration.mjs";
import { joinWaitlist, reviewWaitlistDetails } from "../src/domain/waitlist.mjs";
import {
  freshCatalogue,
  goodDetails,
  goodWaitlistDetails,
  offers,
  participants,
  shortlyAfter,
  workshops
} from "./support/catalogue.mjs";

const contracts = loadDataContracts();

function conforms(name, value) {
  const problems = checkAgainstContract(contracts.get(name), value);
  assert.deepEqual(problems, [], `${name}: ${problems.map((problem) => `${problem.pointer} ${problem.message}`).join(", ")}`);
}

describe("the product's authored contracts", () => {
  it("loads one contract per authored shape", () => {
    assert.deepEqual([...contracts.keys()].sort(), [
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
  });

  it("rejects a document that is missing something the contract requires", () => {
    assert.equal(conformsToContract(contracts.get("StatusMessage"), { title: "Only a title" }), false);
  });

  it("rejects a document carrying something the contract does not allow", () => {
    assert.equal(
      conformsToContract(contracts.get("WorkshopTeaser"), {
        title: "t",
        summary: "s",
        date: "d",
        location: "l",
        price: "free"
      }),
      false
    );
  });

  it("rejects a value outside a contract's allowed set", () => {
    assert.equal(conformsToContract(contracts.get("StatusNotice"), { message: "m", tone: "loud" }), false);
    assert.equal(conformsToContract(contracts.get("StatusNotice"), { message: "m", tone: "info" }), true);
  });
});

describe("the documents the service hands out", () => {
  let database;

  beforeEach(() => {
    database = freshCatalogue();
  });

  afterEach(() => {
    database.close();
  });

  it("gives every workshop teaser the teaser shape", () => {
    for (const entry of readWorkshopOverview(database)) conforms("WorkshopTeaser", entry.teaser);
  });

  it("gives every workshop detail the detail shape", () => {
    for (const workshopId of Object.values(workshops)) {
      const detail = readWorkshopDetail(database, workshopId, participants.grace);
      conforms("WorkshopDetail", detail.detail);
      if (detail.notice !== undefined) conforms("StatusNotice", detail.notice);
      if (detail.status !== undefined) conforms("StatusMessage", detail.status);
    }
  });

  it("gives the already-registered and already-waitlisted notices the notice shape", () => {
    conforms("StatusNotice", readWorkshopDetail(database, workshops.roomy, participants.ada).notice);
    conforms("StatusNotice", readWorkshopDetail(database, workshops.waitlistOpen, participants.grace).notice);
  });

  it("gives a review summary the review shape", () => {
    conforms(
      "RegistrationReview",
      reviewRegistrationDetails({ database, workshopId: workshops.roomy, submitted: goodDetails }).review
    );
    conforms(
      "WaitlistReview",
      reviewWaitlistDetails({ database, workshopId: workshops.waitlistOpen, submitted: goodWaitlistDetails }).review
    );
  });

  it("gives a form that could not be acted on the form shape", () => {
    conforms(
      "RegistrationForm",
      reviewRegistrationDetails({ database, workshopId: workshops.roomy, submitted: { name: "", email: "x" } }).form
    );
    conforms(
      "WaitlistForm",
      reviewWaitlistDetails({ database, workshopId: workshops.waitlistOpen, submitted: { name: "", email: "x" } })
        .form
    );
  });

  it("gives every booking outcome that carries a message the message shape", () => {
    const book = (workshopId, participantId, submitted = goodDetails) =>
      confirmRegistration({ database, workshopId, participantId, submitted, now: shortlyAfter });

    conforms("StatusMessage", book(workshops.roomy, participants.grace).status);
    conforms("StatusMessage", book(workshops.roomy, participants.grace).status);
    conforms("StatusMessage", book(workshops.closed, participants.grace).status);
    conforms("WorkshopDetail", book(workshops.waitlistOpen, participants.ada).detail);
    conforms("RegistrationForm", book(workshops.roomy, participants.alan, {}).form);
  });

  it("gives every waitlist outcome that carries a message the message shape", () => {
    const join = (workshopId, participantId) =>
      joinWaitlist({ database, workshopId, participantId, submitted: goodWaitlistDetails, now: shortlyAfter });

    conforms("StatusMessage", join(workshops.waitlistOpen, participants.alan).status);
    conforms("StatusMessage", join(workshops.waitlistOpen, participants.alan).status);
    conforms("StatusMessage", join(workshops.closed, participants.alan).status);
    conforms("StatusMessage", readWaitlistStanding(database, workshops.waitlistOpen, participants.alan).status);
  });

  it("gives an invalid submission the form shape it was submitted as", () => {
    const registration = confirmRegistration({
      database,
      workshopId: workshops.roomy,
      participantId: participants.grace,
      submitted: { name: "", email: "no" },
      now: shortlyAfter
    });
    conforms("RegistrationForm", registration.form);

    const waitlist = joinWaitlist({
      database,
      workshopId: workshops.waitlistOpen,
      participantId: participants.alan,
      submitted: { name: "", email: "no", notes: "n".repeat(501) },
      now: shortlyAfter
    });
    conforms("WaitlistForm", waitlist.form);
  });

  it("gives an offer waiting for an answer the offer summary shape", () => {
    const open = readOfferedPlace({
      database,
      offeredPlaceId: offers.waiting,
      participantId: participants.grace,
      now: shortlyAfter
    });

    conforms("OfferSummary", open.offer);
  });

  it("gives every settled offer the message shape", () => {
    const settled = [
      [offers.passedDeadline, participants.alan],
      [offers.withdrawn, participants.katherine],
      [offers.taken, participants.ada],
      [offers.passedOn, participants.mary]
    ];

    for (const [offeredPlaceId, participantId] of settled) {
      const open = readOfferedPlace({ database, offeredPlaceId, participantId, now: shortlyAfter });
      conforms("StatusMessage", open.status);
    }
  });

  it("gives every answer to an offer the message shape", () => {
    const answers = [
      respondToOfferedPlace({
        database,
        offeredPlaceId: offers.waiting,
        participantId: participants.grace,
        response: "accept",
        now: shortlyAfter
      }),
      respondToOfferedPlace({
        database,
        offeredPlaceId: offers.waiting,
        participantId: participants.grace,
        response: "decline",
        now: shortlyAfter
      }),
      respondToOfferedPlace({
        database,
        offeredPlaceId: offers.passedDeadline,
        participantId: participants.alan,
        response: "accept",
        now: shortlyAfter
      }),
      respondToOfferedPlace({
        database,
        offeredPlaceId: offers.withdrawn,
        participantId: participants.katherine,
        response: "decline",
        now: shortlyAfter
      })
    ];

    for (const answer of answers) conforms("StatusMessage", answer.status);
  });
});
