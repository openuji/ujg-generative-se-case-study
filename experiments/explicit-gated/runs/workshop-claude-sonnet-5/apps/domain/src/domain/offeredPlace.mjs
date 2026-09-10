/**
 * Responding to a place a workshop has offered to one waitlisted participant.
 *
 * Two rules hold for every response, and both are enforced here rather than at
 * any screen:
 *
 * 1. An offered place belongs to one participant. Only that participant may
 *    take it or pass it on.
 * 2. Whichever way it is answered, the answer resolves the participation of the
 *    participant and workshop the offer itself names. The offer row is the only
 *    source for those two facts; the request only says who is asking.
 *
 * As with booking a place, the offer's real state is established at the moment
 * the response is written. An offer whose deadline has passed has run out even
 * if nothing has swept it yet, so the deadline is applied first, inside the same
 * write transaction that records the answer.
 */

import { inWriteTransaction } from "../persistence/database.mjs";
import {
  offerAcceptedMessage,
  offerDeclinedMessage,
  offerExpiredMessage,
  offerSummary,
  offerUnavailableMessage
} from "./presentation.mjs";
import {
  expirePassedOffers,
  findOfferedPlace,
  findParticipant,
  findParticipation,
  findWorkshop,
  listOfferedPlaces,
  setOfferedPlaceStatus,
  setParticipationStatus
} from "./repository.mjs";

export const offerViews = Object.freeze(["available", "expired", "unavailable", "accepted", "declined"]);

/** Whoever the offer is for, described well enough to address them. */
function offerHolder(database, offer) {
  return (
    findParticipation(database, offer.workshop_id, offer.participant_id) ??
    findParticipant(database, offer.participant_id)
  );
}

/**
 * How an answer to an offer that is no longer waiting is reported. An offer
 * that ran out or was withdrawn keeps that wording; one that was already
 * answered reports the answer that stands.
 */
const settledOutcomes = Object.freeze({
  expired: "expired",
  unavailable: "unavailable",
  accepted: "alreadyAccepted",
  declined: "alreadyDeclined"
});

/**
 * Describes an offer that is no longer waiting for an answer. The wording of
 * each settled state is the same whether the participant is looking at the
 * offer or has just answered it.
 */
function settledOffer(database, offer, workshop) {
  switch (offer.offered_place_status) {
    case "expired":
      return { view: "expired", status: offerExpiredMessage(offer, workshop) };
    case "unavailable":
      return { view: "unavailable", status: offerUnavailableMessage(offer, workshop) };
    case "accepted":
      return { view: "accepted", status: offerAcceptedMessage(offer, workshop, offerHolder(database, offer)) };
    default:
      return { view: "declined", status: offerDeclinedMessage(offer, workshop, offerHolder(database, offer)) };
  }
}

/**
 * Applies every deadline that has passed and returns the offer as it now
 * stands. Time running out is the one change to an offer that nobody asks for.
 */
function currentOffer(database, offeredPlaceId, now) {
  expirePassedOffers(database, now);
  return findOfferedPlace(database, offeredPlaceId);
}

/**
 * Opens an offered place for `participantId`.
 *
 * Outcomes: `found` with the view the participant should see, `unknownOffer`,
 * or `notPermitted` when the offer was made to somebody else.
 */
export function readOfferedPlace({ database, offeredPlaceId, participantId, now = new Date() }) {
  return inWriteTransaction(database, () => {
    const offer = currentOffer(database, offeredPlaceId, now);
    if (offer === null) return { outcome: "unknownOffer" };
    if (offer.participant_id !== participantId) return { outcome: "notPermitted" };

    const workshop = findWorkshop(database, offer.workshop_id);
    if (offer.offered_place_status === "available") {
      return { outcome: "found", id: offer.id, view: "available", offer: offerSummary(offer, workshop) };
    }
    return { outcome: "found", id: offer.id, ...settledOffer(database, offer, workshop) };
  });
}

/** Every offer made to `participantId`, with deadlines already applied. */
export function readOfferedPlaces({ database, participantId, now = new Date() }) {
  return inWriteTransaction(database, () => {
    expirePassedOffers(database, now);
    return listOfferedPlaces(database, participantId).map((offer) => {
      const workshop = findWorkshop(database, offer.workshop_id);
      return {
        id: offer.id,
        workshopTitle: workshop.title,
        view: offer.offered_place_status === "available" ? "available" : offer.offered_place_status
      };
    });
  });
}

/**
 * Answers an offered place on behalf of `participantId`.
 *
 * `response` is `accept` or `decline`.
 *
 * Outcomes:
 * - `accepted`        the offer was taken and the participation is confirmed;
 * - `declined`        the offer was passed on and the participation stays on
 *                     the waitlist, untouched;
 * - `expired`         the deadline had passed before the answer arrived;
 * - `unavailable`     the place was withdrawn before the answer arrived;
 * - `alreadyAccepted` / `alreadyDeclined`
 *                     the offer had already been answered, so this answer
 *                     changes nothing and the settled outcome stands;
 * - `notPermitted`    the offer was made to a different participant;
 * - `unknownOffer`    there is no such offer.
 */
export function respondToOfferedPlace({
  database,
  offeredPlaceId,
  participantId,
  response,
  now = new Date()
}) {
  if (response !== "accept" && response !== "decline") {
    throw new TypeError(`An offered place is answered with accept or decline, not ${response}.`);
  }

  return inWriteTransaction(database, () => {
    const offer = currentOffer(database, offeredPlaceId, now);
    if (offer === null) return { outcome: "unknownOffer" };

    // Rule 1. The offer names its participant; nobody else may answer it.
    if (offer.participant_id !== participantId) return { outcome: "notPermitted" };

    // Rule 2. The participation this answer resolves is read from the offer,
    // never from the request, so an answer cannot land on another workshop or
    // another participant even if the request asked it to.
    const workshopId = offer.workshop_id;
    const holderId = offer.participant_id;
    const workshop = findWorkshop(database, workshopId);

    if (offer.offered_place_status !== "available") {
      const settled = settledOffer(database, offer, workshop);
      return { outcome: settledOutcomes[settled.view], effectApplied: false, status: settled.status };
    }

    const participation = findParticipation(database, workshopId, holderId);
    if (participation === null) {
      // There is no participation for this answer to resolve, so the offer
      // cannot be taken up. It is treated exactly as a withdrawn place.
      setOfferedPlaceStatus(database, offer.id, "unavailable", "available");
      return {
        outcome: "unavailable",
        effectApplied: false,
        status: offerUnavailableMessage(offer, workshop)
      };
    }

    const answeredStatus = response === "accept" ? "accepted" : "declined";
    if (setOfferedPlaceStatus(database, offer.id, answeredStatus, "available") !== 1) {
      // Another answer to the same offer landed first. Report where the offer
      // actually ended up rather than the answer this request hoped for.
      const settled = settledOffer(database, currentOffer(database, offer.id, now), workshop);
      return { outcome: settledOutcomes[settled.view], effectApplied: false, status: settled.status };
    }

    if (response === "decline") {
      // Passing on the place leaves the waitlist position exactly as it was.
      return {
        outcome: "declined",
        effectApplied: true,
        status: offerDeclinedMessage(offer, workshop, participation)
      };
    }

    // Taking the place resolves the place the offer was holding, so it does not
    // also draw one from the places the workshop is still advertising: that
    // place was set aside when the offer was made.
    setParticipationStatus(database, workshopId, holderId, "confirmed");
    return {
      outcome: "accepted",
      effectApplied: true,
      status: offerAcceptedMessage(offer, workshop, findParticipation(database, workshopId, holderId))
    };
  });
}
