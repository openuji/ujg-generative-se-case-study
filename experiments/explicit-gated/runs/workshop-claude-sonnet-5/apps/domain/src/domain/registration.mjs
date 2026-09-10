/**
 * Booking a place on a workshop.
 *
 * Whether a place can be booked is decided here and nowhere else. The screen a
 * participant came from may have shown an available place minutes ago; what
 * counts is the state of the workshop at the moment the booking is written, so
 * the workshop is read again inside the same write transaction that books it.
 */

import { inWriteTransaction } from "../persistence/database.mjs";
import {
  registrationAlreadyConfirmedMessage,
  registrationClosedMessage,
  registrationConfirmedMessage,
  registrationReview,
  workshopDetail
} from "./presentation.mjs";
import { findParticipation, findWorkshop, recordParticipation, takeAvailablePlace } from "./repository.mjs";
import { checkRegistrationDetails } from "./validation.mjs";

/**
 * Checks submitted registration details and, when they hold up, produces the
 * summary the participant reviews before the place is booked. Nothing is
 * recorded here; this step only decides whether the details can be acted on.
 *
 * Outcomes: `ready` with the review summary, `invalidDetails` with the same
 * form carrying a message per field at fault, or `unknownWorkshop`.
 */
export function reviewRegistrationDetails({ database, workshopId, submitted }) {
  const workshop = findWorkshop(database, workshopId);
  if (workshop === null) return { outcome: "unknownWorkshop" };

  const checked = checkRegistrationDetails(submitted);
  if (!checked.valid) return { outcome: "invalidDetails", form: checked.form };
  return { outcome: "ready", review: registrationReview(workshop, checked.details) };
}

/**
 * Books a place for `participantId` on `workshopId`.
 *
 * Outcomes:
 * - `confirmed`          the place was taken and the participation written;
 * - `alreadyConfirmed`   the participant already held a place, nothing changed;
 * - `placeUnavailable`   the last place went before this booking landed, and
 *                        the workshop is now taking waitlist entries instead;
 * - `registrationClosed` the workshop stopped taking entries altogether;
 * - `invalidDetails`     the submitted details cannot be booked as they stand.
 */
export function confirmRegistration({ database, workshopId, participantId, submitted, now = new Date() }) {
  const checked = checkRegistrationDetails(submitted);
  if (!checked.valid) return { outcome: "invalidDetails", form: checked.form };

  return inWriteTransaction(database, () => {
    const workshop = findWorkshop(database, workshopId);
    if (workshop === null) return { outcome: "unknownWorkshop" };

    const existing = findParticipation(database, workshopId, participantId);
    if (existing?.participation_status === "confirmed") {
      return {
        outcome: "alreadyConfirmed",
        effectApplied: false,
        status: registrationAlreadyConfirmedMessage(workshop, existing)
      };
    }

    if (workshop.registration_availability === "placeAvailable" && takeAvailablePlace(database, workshopId) === 1) {
      const participation = {
        workshopId,
        participantId,
        participationStatus: "confirmed",
        name: checked.details.name,
        email: checked.details.email,
        notes: checked.details.notes,
        recordedAt: now.toISOString()
      };
      recordParticipation(database, participation);
      return {
        outcome: "confirmed",
        effectApplied: true,
        status: registrationConfirmedMessage(workshop, participation)
      };
    }

    // Either the workshop was already past taking bookings, or the place this
    // booking was aiming at went to somebody else a moment ago. Read the
    // workshop again so the answer describes where it stands now.
    const settled = findWorkshop(database, workshopId);
    if (settled.registration_availability === "registrationClosed") {
      return {
        outcome: "registrationClosed",
        effectApplied: false,
        status: registrationClosedMessage(settled)
      };
    }
    return {
      outcome: "placeUnavailable",
      effectApplied: false,
      id: settled.id,
      detail: workshopDetail(settled)
    };
  });
}
