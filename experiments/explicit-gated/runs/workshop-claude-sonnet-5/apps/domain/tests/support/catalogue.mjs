/**
 * A catalogue to run one test against.
 *
 * Every suite starts from the same seeded starting point at the same moment, so
 * the deadlines the offer fixtures carry land in known places: one offer is
 * still waiting, one ran out six hours ago, and the rest are already settled.
 */

import { openDatabase } from "../../src/persistence/database.mjs";
import { bootstrapCatalogue } from "../../src/persistence/fixtures.mjs";

/** The moment every seeded catalogue is created at. */
export const seededAt = new Date("2026-01-15T10:00:00.000Z");

/** A moment shortly after seeding, used as "now" for most decisions. */
export const shortlyAfter = new Date("2026-01-15T11:00:00.000Z");

/** A moment after every seeded offer deadline has passed. */
export const afterEveryDeadline = new Date("2026-01-30T10:00:00.000Z");

export const workshops = Object.freeze({
  lastPlace: "workshop-accessible-forms",
  roomy: "workshop-design-tokens",
  waitlistOpen: "workshop-service-design",
  closed: "workshop-research-ops",
  offering: "workshop-inclusive-copy"
});

export const participants = Object.freeze({
  ada: "participant-ada",
  grace: "participant-grace",
  alan: "participant-alan",
  katherine: "participant-katherine",
  mary: "participant-mary"
});

export const offers = Object.freeze({
  waiting: "offer-grace-inclusive-copy",
  passedDeadline: "offer-alan-inclusive-copy",
  withdrawn: "offer-katherine-inclusive-copy",
  taken: "offer-ada-inclusive-copy",
  passedOn: "offer-mary-inclusive-copy"
});

export const goodDetails = Object.freeze({
  name: "Grace Hopper",
  email: "grace@workshops.example",
  accessibilityNotes: "Step-free access, please."
});

export const goodWaitlistDetails = Object.freeze({
  name: "Alan Turing",
  email: "alan@workshops.example",
  notes: "Any date works."
});

export function freshCatalogue() {
  const database = openDatabase(":memory:");
  bootstrapCatalogue(database, seededAt);
  return database;
}

export function readWorkshopRow(database, workshopId) {
  return database.prepare("SELECT * FROM workshops WHERE id = ?").get(workshopId);
}

export function readParticipationRow(database, workshopId, participantId) {
  return database
    .prepare("SELECT * FROM workshop_participations WHERE workshop_id = ? AND participant_id = ?")
    .get(workshopId, participantId);
}

export function readOfferRow(database, offeredPlaceId) {
  return database.prepare("SELECT * FROM offered_places WHERE id = ?").get(offeredPlaceId);
}
