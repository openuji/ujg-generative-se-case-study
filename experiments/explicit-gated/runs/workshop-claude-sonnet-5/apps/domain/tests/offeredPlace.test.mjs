/**
 * Answering a place offered to one participant.
 *
 * Two rules are checked over and over here, because everything else about the
 * feature depends on them: an offer can only be answered by the participant it
 * was made to, and whichever way it is answered it resolves the participation
 * of the participant and workshop the offer itself names.
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { readOfferedPlace, readOfferedPlaces, respondToOfferedPlace } from "../src/domain/offeredPlace.mjs";
import {
  afterEveryDeadline,
  freshCatalogue,
  offers,
  participants,
  readOfferRow,
  readParticipationRow,
  readWorkshopRow,
  shortlyAfter,
  workshops
} from "./support/catalogue.mjs";

describe("opening an offered place", () => {
  let database;

  const open = (offeredPlaceId, participantId, now = shortlyAfter) =>
    readOfferedPlace({ database, offeredPlaceId, participantId, now });

  beforeEach(() => {
    database = freshCatalogue();
  });

  afterEach(() => {
    database.close();
  });

  it("shows an offer that is still waiting for an answer", () => {
    const result = open(offers.waiting, participants.grace);

    assert.equal(result.outcome, "found");
    assert.equal(result.view, "available");
    assert.equal(result.offer.workshopTitle, "Inclusive Copywriting");
    assert.equal(result.status, undefined);
  });

  it("shows an offer whose deadline has passed as run out", () => {
    const result = open(offers.passedDeadline, participants.alan);

    assert.equal(result.view, "expired");
    assert.equal(result.status.title, "This offer has run out");
    assert.equal(result.status.tone, "warning");
  });

  it("settles a passed deadline in the catalogue, not only in the answer", () => {
    open(offers.passedDeadline, participants.alan);

    assert.equal(readOfferRow(database, offers.passedDeadline).offered_place_status, "expired");
  });

  it("shows a withdrawn place as no longer available", () => {
    const result = open(offers.withdrawn, participants.katherine);

    assert.equal(result.view, "unavailable");
    assert.equal(result.status.title, "This place is no longer available");
    assert.equal(result.status.tone, "error");
  });

  it("shows an offer that was already taken", () => {
    const result = open(offers.taken, participants.ada);

    assert.equal(result.view, "accepted");
    assert.equal(result.status.title, "Your place is booked");
  });

  it("shows an offer that was already passed on", () => {
    const result = open(offers.passedOn, participants.mary);

    assert.equal(result.view, "declined");
    assert.equal(result.status.title, "You stay on the waitlist");
  });

  it("shows a still-waiting offer as run out once its deadline goes by", () => {
    assert.equal(open(offers.waiting, participants.grace, afterEveryDeadline).view, "expired");
  });

  it("refuses to describe a place offered to somebody else", () => {
    assert.equal(open(offers.waiting, participants.alan).outcome, "notPermitted");
    assert.equal(open(offers.taken, participants.grace).outcome, "notPermitted");
  });

  it("reports an offer that does not exist", () => {
    assert.equal(open("offer-nowhere", participants.grace).outcome, "unknownOffer");
  });

  it("lists only the offers made to the participant asking", () => {
    const forGrace = readOfferedPlaces({ database, participantId: participants.grace, now: shortlyAfter });

    assert.deepEqual(forGrace, [{ id: offers.waiting, workshopTitle: "Inclusive Copywriting", view: "available" }]);
  });

  it("applies passed deadlines when listing", () => {
    const forAlan = readOfferedPlaces({ database, participantId: participants.alan, now: shortlyAfter });

    assert.deepEqual(forAlan.map((offer) => offer.view), ["expired"]);
  });
});

describe("taking an offered place", () => {
  let database;

  const answer = (offeredPlaceId, participantId, response, now = shortlyAfter) =>
    respondToOfferedPlace({ database, offeredPlaceId, participantId, response, now });

  beforeEach(() => {
    database = freshCatalogue();
  });

  afterEach(() => {
    database.close();
  });

  it("confirms the participant the offer names, on the workshop it names", () => {
    const result = answer(offers.waiting, participants.grace, "accept");

    assert.equal(result.outcome, "accepted");
    assert.equal(result.effectApplied, true);
    assert.equal(result.status.title, "Your place is booked");
    assert.equal(readOfferRow(database, offers.waiting).offered_place_status, "accepted");
    assert.equal(
      readParticipationRow(database, workshops.offering, participants.grace).participation_status,
      "confirmed"
    );
  });

  it("leaves every other participation on that workshop untouched", () => {
    const before = readParticipationRow(database, workshops.offering, participants.alan);
    answer(offers.waiting, participants.grace, "accept");

    assert.deepEqual(readParticipationRow(database, workshops.offering, participants.alan), before);
    assert.equal(
      readParticipationRow(database, workshops.offering, participants.katherine).participation_status,
      "waitlisted"
    );
  });

  it("leaves the same participant's other participations untouched", () => {
    const before = readParticipationRow(database, workshops.waitlistOpen, participants.grace);
    answer(offers.waiting, participants.grace, "accept");

    assert.deepEqual(readParticipationRow(database, workshops.waitlistOpen, participants.grace), before);
  });

  it("does not draw a place from the ones the workshop is still advertising", () => {
    const before = readWorkshopRow(database, workshops.offering);
    answer(offers.waiting, participants.grace, "accept");
    const after = readWorkshopRow(database, workshops.offering);

    assert.equal(after.remaining_places, before.remaining_places);
    assert.ok(after.remaining_places >= 0);
    assert.equal(after.registration_availability, before.registration_availability);
  });

  it("reports an offer whose deadline had passed as run out, and takes nothing", () => {
    const result = answer(offers.passedDeadline, participants.alan, "accept");

    assert.equal(result.outcome, "expired");
    assert.equal(result.effectApplied, false);
    assert.equal(readOfferRow(database, offers.passedDeadline).offered_place_status, "expired");
    assert.equal(
      readParticipationRow(database, workshops.offering, participants.alan).participation_status,
      "waitlisted"
    );
  });

  it("reports a withdrawn place as unavailable, and takes nothing", () => {
    const result = answer(offers.withdrawn, participants.katherine, "accept");

    assert.equal(result.outcome, "unavailable");
    assert.equal(result.effectApplied, false);
    assert.equal(
      readParticipationRow(database, workshops.offering, participants.katherine).participation_status,
      "waitlisted"
    );
  });

  it("answers a repeat of the same acceptance the same way, without acting twice", () => {
    assert.equal(answer(offers.waiting, participants.grace, "accept").outcome, "accepted");
    const recorded = readParticipationRow(database, workshops.offering, participants.grace);

    const repeated = answer(offers.waiting, participants.grace, "accept");
    assert.equal(repeated.outcome, "alreadyAccepted");
    assert.equal(repeated.effectApplied, false);
    assert.deepEqual(readParticipationRow(database, workshops.offering, participants.grace), recorded);
  });

  it("will not let an answer be changed after the fact", () => {
    assert.equal(answer(offers.waiting, participants.grace, "decline").outcome, "declined");

    const reversal = answer(offers.waiting, participants.grace, "accept");
    assert.equal(reversal.outcome, "alreadyDeclined");
    assert.equal(reversal.effectApplied, false);
    assert.equal(
      readParticipationRow(database, workshops.offering, participants.grace).participation_status,
      "waitlisted"
    );
  });
});

describe("passing on an offered place", () => {
  let database;

  const answer = (offeredPlaceId, participantId, response, now = shortlyAfter) =>
    respondToOfferedPlace({ database, offeredPlaceId, participantId, response, now });

  beforeEach(() => {
    database = freshCatalogue();
  });

  afterEach(() => {
    database.close();
  });

  it("leaves the participant on the waitlist for the offer's workshop", () => {
    const before = readParticipationRow(database, workshops.offering, participants.grace);
    const result = answer(offers.waiting, participants.grace, "decline");

    assert.equal(result.outcome, "declined");
    assert.equal(result.effectApplied, true);
    assert.equal(result.status.title, "You stay on the waitlist");
    assert.equal(readOfferRow(database, offers.waiting).offered_place_status, "declined");
    assert.deepEqual(readParticipationRow(database, workshops.offering, participants.grace), before);
  });

  it("reports an offer whose deadline had passed as run out", () => {
    const result = answer(offers.passedDeadline, participants.alan, "decline");

    assert.equal(result.outcome, "expired");
    assert.equal(result.effectApplied, false);
  });

  it("reports a withdrawn place as unavailable", () => {
    assert.equal(answer(offers.withdrawn, participants.katherine, "decline").outcome, "unavailable");
  });

  it("answers a repeat of the same refusal the same way", () => {
    assert.equal(answer(offers.waiting, participants.grace, "decline").outcome, "declined");
    const repeated = answer(offers.waiting, participants.grace, "decline");

    assert.equal(repeated.outcome, "alreadyDeclined");
    assert.equal(repeated.effectApplied, false);
  });
});

describe("the participant an offered place belongs to", () => {
  let database;

  const answer = (offeredPlaceId, participantId, response) =>
    respondToOfferedPlace({ database, offeredPlaceId, participantId, response, now: shortlyAfter });

  beforeEach(() => {
    database = freshCatalogue();
  });

  afterEach(() => {
    database.close();
  });

  it("refuses an acceptance from anyone else, and changes nothing at all", () => {
    const offer = readOfferRow(database, offers.waiting);
    const intruderBefore = readParticipationRow(database, workshops.offering, participants.alan);

    const result = answer(offers.waiting, participants.alan, "accept");

    assert.equal(result.outcome, "notPermitted");
    assert.deepEqual(readOfferRow(database, offers.waiting), offer);
    assert.deepEqual(readParticipationRow(database, workshops.offering, participants.alan), intruderBefore);
    assert.equal(
      readParticipationRow(database, workshops.offering, participants.grace).participation_status,
      "waitlisted"
    );
  });

  it("refuses a refusal from anyone else, and changes nothing at all", () => {
    const offer = readOfferRow(database, offers.waiting);

    assert.equal(answer(offers.waiting, participants.katherine, "decline").outcome, "notPermitted");
    assert.deepEqual(readOfferRow(database, offers.waiting), offer);
  });

  it("refuses even a participant who is waitlisted for the same workshop", () => {
    assert.equal(
      readParticipationRow(database, workshops.offering, participants.alan).participation_status,
      "waitlisted"
    );

    assert.equal(answer(offers.waiting, participants.alan, "accept").outcome, "notPermitted");
  });

  it("refuses a participant who already holds a place on the same workshop", () => {
    assert.equal(answer(offers.waiting, participants.ada, "accept").outcome, "notPermitted");
  });

  it("checks who is asking before it checks whether the offer can still be answered", () => {
    assert.equal(answer(offers.withdrawn, participants.grace, "accept").outcome, "notPermitted");
    assert.equal(readOfferRow(database, offers.withdrawn).offered_place_status, "unavailable");
  });

  it("reports an offer that does not exist rather than acting on nothing", () => {
    assert.equal(answer("offer-nowhere", participants.grace, "accept").outcome, "unknownOffer");
  });

  it("will not be answered with anything other than taking or passing it on", () => {
    assert.throws(() => answer(offers.waiting, participants.grace, "maybe"), TypeError);
    assert.equal(readOfferRow(database, offers.waiting).offered_place_status, "available");
  });
});

describe("an offered place with no participation to resolve", () => {
  let database;

  beforeEach(() => {
    database = freshCatalogue();
  });

  afterEach(() => {
    database.close();
  });

  it("cannot be taken up, and settles as unavailable", () => {
    database
      .prepare("DELETE FROM workshop_participations WHERE workshop_id = ? AND participant_id = ?")
      .run(workshops.offering, participants.grace);

    const result = respondToOfferedPlace({
      database,
      offeredPlaceId: offers.waiting,
      participantId: participants.grace,
      response: "accept",
      now: shortlyAfter
    });

    assert.equal(result.outcome, "unavailable");
    assert.equal(result.effectApplied, false);
    assert.equal(readOfferRow(database, offers.waiting).offered_place_status, "unavailable");
    assert.equal(readParticipationRow(database, workshops.offering, participants.grace), undefined);
  });
});
