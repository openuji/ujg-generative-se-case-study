/**
 * Joining the waitlist for a workshop.
 *
 * As with booking a place, whether the waitlist is still open is decided at the
 * moment the entry is written, not at the moment the form was filled in.
 */

import { inWriteTransaction } from "../persistence/database.mjs";
import { alreadyWaitlistedMessage, registrationClosedMessage, waitlistedMessage } from "./presentation.mjs";
import { findParticipation, findWorkshop, recordParticipation } from "./repository.mjs";
import { checkWaitlistDetails } from "./validation.mjs";

/**
 * Puts `participantId` on the waitlist for `workshopId`.
 *
 * Outcomes:
 * - `waitlisted`         the waitlist entry was written;
 * - `alreadyWaitlisted`  the participant was already on the waitlist, nothing
 *                        changed and their position is untouched;
 * - `registrationClosed` the workshop stopped taking entries;
 * - `invalidDetails`     the submitted details cannot be recorded as they stand;
 * - `unsupported`        the workshop is not offering a waitlist to this
 *                        participant, so there is nothing to join.
 */
export function joinWaitlist({ database, workshopId, participantId, submitted, now = new Date() }) {
  const checked = checkWaitlistDetails(submitted);
  if (!checked.valid) return { outcome: "invalidDetails", form: checked.form };

  return inWriteTransaction(database, () => {
    const workshop = findWorkshop(database, workshopId);
    if (workshop === null) return { outcome: "unknownWorkshop" };

    const existing = findParticipation(database, workshopId, participantId);
    if (existing?.participation_status === "waitlisted") {
      return {
        outcome: "alreadyWaitlisted",
        effectApplied: false,
        status: alreadyWaitlistedMessage(workshop, existing)
      };
    }
    if (existing?.participation_status === "confirmed") {
      // A booked place is not something a waitlist entry may quietly replace.
      return { outcome: "unsupported", effectApplied: false };
    }

    if (workshop.registration_availability === "waitlistOpen") {
      const participation = {
        workshopId,
        participantId,
        participationStatus: "waitlisted",
        name: checked.details.name,
        email: checked.details.email,
        notes: checked.details.notes,
        recordedAt: now.toISOString()
      };
      recordParticipation(database, participation);
      return {
        outcome: "waitlisted",
        effectApplied: true,
        status: waitlistedMessage(workshop, participation)
      };
    }

    if (workshop.registration_availability === "registrationClosed") {
      return {
        outcome: "registrationClosed",
        effectApplied: false,
        status: registrationClosedMessage(workshop)
      };
    }

    // The workshop still has places, so nobody needs a waitlist entry for it.
    return { outcome: "unsupported", effectApplied: false };
  });
}
