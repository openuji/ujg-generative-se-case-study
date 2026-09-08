/**
 * Bootstrap data for the workshop service.
 *
 * The catalogue is seeded so that every situation a participant can reach is
 * reachable from a running service: a workshop with a single open place (so the
 * last place can genuinely run out), a roomier one, a workshop that only takes
 * waitlist entries, a closed one, and a workshop whose waitlist already carries
 * offered places in each of the states an offer can be in.
 */

import { inWriteTransaction } from "./database.mjs";

const hour = 60 * 60 * 1000;

export const participantFixtures = Object.freeze([
  { id: "participant-ada", name: "Ada Lovelace", email: "ada@workshops.example" },
  { id: "participant-grace", name: "Grace Hopper", email: "grace@workshops.example" },
  { id: "participant-alan", name: "Alan Turing", email: "alan@workshops.example" },
  { id: "participant-katherine", name: "Katherine Johnson", email: "katherine@workshops.example" },
  { id: "participant-mary", name: "Mary Jackson", email: "mary@workshops.example" }
]);

export const workshopFixtures = Object.freeze([
  {
    id: "workshop-accessible-forms",
    title: "Accessible Forms",
    summary: "Build forms everyone can complete, on any device.",
    description:
      "A hands-on day rebuilding a real sign-up form: labelling, error recovery, keyboard order and assistive-technology testing.",
    scheduledFor: "12 March 2026, 09:30–16:30",
    location: "Studio 1, Rotterdam",
    registrationAvailability: "placeAvailable",
    remainingPlaces: 1
  },
  {
    id: "workshop-design-tokens",
    title: "Design Tokens in Practice",
    summary: "Take a token set from a design file to a shipped interface.",
    description:
      "Model foundation and semantic tokens, keep two themes honest, and wire the result into a component library without hand-written colour.",
    scheduledFor: "26 March 2026, 09:30–16:30",
    location: "Studio 2, Rotterdam",
    registrationAvailability: "placeAvailable",
    remainingPlaces: 8
  },
  {
    id: "workshop-service-design",
    title: "Service Design Studio",
    summary: "Map a service end to end and find where it breaks.",
    description:
      "Two facilitators, one long service, and a wall of evidence. Bring a service you are responsible for; leave with a map you can act on.",
    scheduledFor: "9 April 2026, 09:30–17:00",
    location: "Studio 1, Utrecht",
    registrationAvailability: "waitlistOpen",
    remainingPlaces: 0
  },
  {
    id: "workshop-research-ops",
    title: "Research Ops Clinic",
    summary: "Put a repeatable research practice behind your product decisions.",
    description:
      "Recruitment, consent, incentives, storage and reuse. A working session for teams that already do research and want it to scale.",
    scheduledFor: "23 April 2026, 13:00–17:00",
    location: "Studio 3, Utrecht",
    registrationAvailability: "registrationClosed",
    remainingPlaces: 0
  },
  {
    id: "workshop-inclusive-copy",
    title: "Inclusive Copywriting",
    summary: "Write interface copy that reads clearly for everybody.",
    description:
      "Plain language, reading level, tone under stress, and how to review copy with the people it is written for.",
    scheduledFor: "7 May 2026, 09:30–16:30",
    location: "Studio 2, Amsterdam",
    registrationAvailability: "waitlistOpen",
    remainingPlaces: 0
  }
]);

export const participationFixtures = Object.freeze([
  {
    workshopId: "workshop-design-tokens",
    participantId: "participant-ada",
    participationStatus: "confirmed",
    name: "Ada Lovelace",
    email: "ada@workshops.example",
    notes: null
  },
  {
    workshopId: "workshop-service-design",
    participantId: "participant-grace",
    participationStatus: "waitlisted",
    name: "Grace Hopper",
    email: "grace@workshops.example",
    notes: "Happy to take a late cancellation."
  },
  {
    workshopId: "workshop-inclusive-copy",
    participantId: "participant-grace",
    participationStatus: "waitlisted",
    name: "Grace Hopper",
    email: "grace@workshops.example",
    notes: null
  },
  {
    workshopId: "workshop-inclusive-copy",
    participantId: "participant-alan",
    participationStatus: "waitlisted",
    name: "Alan Turing",
    email: "alan@workshops.example",
    notes: null
  },
  {
    workshopId: "workshop-inclusive-copy",
    participantId: "participant-katherine",
    participationStatus: "waitlisted",
    name: "Katherine Johnson",
    email: "katherine@workshops.example",
    notes: null
  },
  {
    workshopId: "workshop-inclusive-copy",
    participantId: "participant-mary",
    participationStatus: "waitlisted",
    name: "Mary Jackson",
    email: "mary@workshops.example",
    notes: null
  },
  {
    workshopId: "workshop-inclusive-copy",
    participantId: "participant-ada",
    participationStatus: "confirmed",
    name: "Ada Lovelace",
    email: "ada@workshops.example",
    notes: null
  }
]);

/**
 * Offered places are seeded directly. Nothing in the product creates one: a
 * place is offered by the workshop hosts outside the participant's journey, and
 * the participant only ever responds to an offer that already exists.
 */
export const offeredPlaceFixtures = Object.freeze([
  {
    id: "offer-grace-inclusive-copy",
    workshopId: "workshop-inclusive-copy",
    participantId: "participant-grace",
    offeredPlaceStatus: "available",
    expiresInHours: 72
  },
  {
    id: "offer-alan-inclusive-copy",
    workshopId: "workshop-inclusive-copy",
    participantId: "participant-alan",
    offeredPlaceStatus: "available",
    expiresInHours: -6
  },
  {
    id: "offer-katherine-inclusive-copy",
    workshopId: "workshop-inclusive-copy",
    participantId: "participant-katherine",
    offeredPlaceStatus: "unavailable",
    expiresInHours: 48
  },
  {
    id: "offer-ada-inclusive-copy",
    workshopId: "workshop-inclusive-copy",
    participantId: "participant-ada",
    offeredPlaceStatus: "accepted",
    expiresInHours: 24
  },
  {
    id: "offer-mary-inclusive-copy",
    workshopId: "workshop-inclusive-copy",
    participantId: "participant-mary",
    offeredPlaceStatus: "declined",
    expiresInHours: 24
  }
]);

export function isBootstrapped(database) {
  return database.prepare("SELECT COUNT(*) AS total FROM workshops").get().total > 0;
}

export function bootstrapCatalogue(database, now = new Date()) {
  if (isBootstrapped(database)) return false;
  const recordedAt = now.toISOString();
  inWriteTransaction(database, () => {
    const insertParticipant = database.prepare(
      "INSERT INTO participants (id, name, email) VALUES (?, ?, ?)"
    );
    for (const participant of participantFixtures) {
      insertParticipant.run(participant.id, participant.name, participant.email);
    }

    const insertWorkshop = database.prepare(
      `INSERT INTO workshops
         (id, title, summary, description, scheduled_for, location, registration_availability, remaining_places)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const workshop of workshopFixtures) {
      insertWorkshop.run(
        workshop.id,
        workshop.title,
        workshop.summary,
        workshop.description,
        workshop.scheduledFor,
        workshop.location,
        workshop.registrationAvailability,
        workshop.remainingPlaces
      );
    }

    const insertParticipation = database.prepare(
      `INSERT INTO workshop_participations
         (workshop_id, participant_id, participation_status, name, email, notes, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const participation of participationFixtures) {
      insertParticipation.run(
        participation.workshopId,
        participation.participantId,
        participation.participationStatus,
        participation.name,
        participation.email,
        participation.notes,
        recordedAt
      );
    }

    const insertOffer = database.prepare(
      `INSERT INTO offered_places (id, workshop_id, participant_id, offered_place_status, expires_at)
       VALUES (?, ?, ?, ?, ?)`
    );
    for (const offer of offeredPlaceFixtures) {
      insertOffer.run(
        offer.id,
        offer.workshopId,
        offer.participantId,
        offer.offeredPlaceStatus,
        new Date(now.getTime() + offer.expiresInHours * hour).toISOString()
      );
    }
  });
  return true;
}
