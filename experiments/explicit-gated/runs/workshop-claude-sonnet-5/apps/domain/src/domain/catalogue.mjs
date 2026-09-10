/**
 * What a participant sees before they do anything: the list of workshops, and
 * the one workshop they opened.
 *
 * The detail screen a participant gets depends on facts only the service knows:
 * whether they already hold a place or a waitlist position, and whether the
 * workshop is still taking registrations. Resolving that here keeps the screen
 * a participant lands on correct on a fresh visit and on a reload.
 */

import {
  alreadyRegisteredNotice,
  alreadyWaitlistedNotice,
  registrationClosedMessage,
  waitlistedMessage,
  workshopDetail,
  workshopTeaser
} from "./presentation.mjs";
import { findParticipation, findWorkshop, listWorkshops } from "./repository.mjs";

export const workshopViews = Object.freeze([
  "registrationOpen",
  "waitlistOpen",
  "registrationClosed",
  "alreadyRegistered",
  "alreadyWaitlisted"
]);

export function readWorkshopOverview(database) {
  return listWorkshops(database).map((workshop) => ({
    id: workshop.id,
    teaser: workshopTeaser(workshop)
  }));
}

/**
 * Resolves the situation a participant is in for one workshop. An existing
 * place or waitlist position takes precedence over what the workshop is
 * currently offering, because the participant has nothing left to do here.
 */
export function readWorkshopDetail(database, workshopId, participantId) {
  const workshop = findWorkshop(database, workshopId);
  if (workshop === null) return { outcome: "unknownWorkshop" };

  const participation = participantId === null ? null : findParticipation(database, workshopId, participantId);
  const payload = { outcome: "found", id: workshop.id, detail: workshopDetail(workshop) };

  if (participation?.participation_status === "confirmed") {
    return { ...payload, view: "alreadyRegistered", notice: alreadyRegisteredNotice(workshop) };
  }
  if (participation?.participation_status === "waitlisted") {
    return { ...payload, view: "alreadyWaitlisted", notice: alreadyWaitlistedNotice(workshop) };
  }
  if (workshop.registration_availability === "placeAvailable") {
    return { ...payload, view: "registrationOpen" };
  }
  if (workshop.registration_availability === "waitlistOpen") {
    return { ...payload, view: "waitlistOpen" };
  }
  return { ...payload, view: "registrationClosed", status: registrationClosedMessage(workshop) };
}

/**
 * A participant's standing on one workshop's waitlist. A participant who is
 * told they were already on the list can carry on from here to the same
 * waitlisted answer a fresh entry would have given them.
 */
export function readWaitlistStanding(database, workshopId, participantId) {
  const workshop = findWorkshop(database, workshopId);
  if (workshop === null) return { outcome: "unknownWorkshop" };

  const participation = findParticipation(database, workshopId, participantId);
  if (participation?.participation_status !== "waitlisted") return { outcome: "notWaitlisted" };
  return { outcome: "waitlisted", id: workshop.id, status: waitlistedMessage(workshop, participation) };
}
