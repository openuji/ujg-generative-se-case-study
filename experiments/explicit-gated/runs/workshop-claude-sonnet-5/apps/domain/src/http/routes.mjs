/**
 * Everything the workshop service answers.
 *
 * Each entry describes one route completely: the method and path, whether a
 * signed-in participant is required, the contract an incoming body must
 * satisfy, the answers it can give, and the work it does. The dispatcher, the
 * body check and the served API description all read this one table, so the
 * service cannot describe a route it does not have or answer with a shape it
 * did not declare.
 */

import {
  readWaitlistStanding,
  readWorkshopDetail,
  readWorkshopOverview,
  workshopViews
} from "../domain/catalogue.mjs";
import { offerViews, readOfferedPlace, readOfferedPlaces, respondToOfferedPlace } from "../domain/offeredPlace.mjs";
import { confirmRegistration, reviewRegistrationDetails } from "../domain/registration.mjs";
import { joinWaitlist, reviewWaitlistDetails } from "../domain/waitlist.mjs";
import { readSignInDirectory, startSession } from "../identity/sessions.mjs";
import { offerLink, renderOfferEmail } from "../messaging/offerEmail.mjs";
import { arrayOf, contract, object, oneOf, problem, text } from "./contracts.mjs";

const participantSchema = object(
  { id: text(), name: text(), email: text() },
  ["id", "name", "email"]
);

const messageSchema = object(
  {
    to: text("The address the message was addressed to."),
    subject: text(),
    html: text("The rendered message body."),
    deliveredAt: text("When the delivery stand-in accepted it.")
  },
  ["to", "subject", "html", "deliveredAt"]
);

/** Answers that carry a status message and say whether anything changed. */
function outcomeSchema(outcomes, extra = {}) {
  return object(
    {
      outcome: oneOf(...outcomes),
      effectApplied: { type: "boolean", description: "Whether the request changed anything." },
      status: contract("StatusMessage"),
      ...extra
    },
    ["outcome"]
  );
}

function answer(status, body) {
  return { status, body };
}

function noSuchWorkshop() {
  return answer(404, problem("There is no such workshop."));
}

/**
 * Maps a registration or waitlist outcome onto the answer the wire carries.
 * A refused command is still a modelled outcome, so each one keeps its own
 * status code and its own document rather than collapsing into one error.
 */
const submissionStatusCodes = Object.freeze({
  confirmed: 200,
  alreadyConfirmed: 200,
  waitlisted: 200,
  alreadyWaitlisted: 200,
  placeUnavailable: 409,
  registrationClosed: 409,
  unsupported: 409,
  invalidDetails: 422
});

const offerStatusCodes = Object.freeze({
  accepted: 200,
  declined: 200,
  alreadyAccepted: 200,
  alreadyDeclined: 200,
  expired: 409,
  unavailable: 409
});

function offerAnswer(result) {
  if (result.outcome === "unknownOffer") return answer(404, problem("There is no such offered place."));
  if (result.outcome === "notPermitted") {
    return answer(403, problem("This place was offered to somebody else."));
  }
  return answer(offerStatusCodes[result.outcome], result);
}

export const routes = Object.freeze([
  {
    method: "GET",
    path: "/api/participants",
    operationId: "listParticipants",
    tag: "Signing in",
    summary: "List the participants a caller may sign in as",
    description:
      "The service has no identity provider of its own. It seeds a small directory of participants and lets a caller take one of them, which is enough for every subject rule the product enforces.",
    session: "none",
    responses: [
      {
        status: 200,
        description: "The seeded participant directory.",
        schema: object({ participants: arrayOf(participantSchema) }, ["participants"])
      }
    ],
    handle: ({ database }) => answer(200, { participants: readSignInDirectory(database) })
  },
  {
    method: "POST",
    path: "/api/sessions",
    operationId: "startSession",
    tag: "Signing in",
    summary: "Sign in as a seeded participant",
    description: "Returns a session token to send as a bearer token on every later request.",
    session: "none",
    requestBody: {
      description: "The participant to sign in as.",
      schema: object({ participantId: text() }, ["participantId"])
    },
    responses: [
      {
        status: 201,
        description: "The session and the participant holding it.",
        schema: object({ token: text(), participant: participantSchema }, ["token", "participant"])
      },
      { status: 404, description: "There is no such participant." }
    ],
    handle: ({ database, body, now }) => {
      const session = startSession(database, body.participantId, now);
      if (session === null) return answer(404, problem("There is no such participant."));
      return answer(201, session);
    }
  },
  {
    method: "GET",
    path: "/api/sessions/current",
    operationId: "readCurrentSession",
    tag: "Signing in",
    summary: "Read the signed-in participant",
    session: "required",
    responses: [
      {
        status: 200,
        description: "The participant this session belongs to.",
        schema: object({ participant: participantSchema }, ["participant"])
      }
    ],
    handle: ({ participant }) => answer(200, { participant })
  },
  {
    method: "DELETE",
    path: "/api/sessions/current",
    operationId: "endCurrentSession",
    tag: "Signing in",
    summary: "Sign out",
    session: "required",
    responses: [{ status: 204, description: "The session was ended." }],
    handle: ({ endCurrentSession }) => {
      endCurrentSession();
      return { status: 204 };
    }
  },

  {
    method: "GET",
    path: "/api/workshops",
    operationId: "listWorkshops",
    tag: "Workshops",
    summary: "Browse the workshops on offer",
    session: "none",
    responses: [
      {
        status: 200,
        description: "Every workshop, as a teaser.",
        schema: object(
          { workshops: arrayOf(object({ id: text(), teaser: contract("WorkshopTeaser") }, ["id", "teaser"])) },
          ["workshops"]
        )
      }
    ],
    handle: ({ database }) => answer(200, { workshops: readWorkshopOverview(database) })
  },
  {
    method: "GET",
    path: "/api/workshops/{workshopId}",
    operationId: "readWorkshop",
    tag: "Workshops",
    summary: "Open one workshop",
    description:
      "Answers with the situation the signed-in participant is actually in for this workshop: a place they already hold or a waitlist position they already have takes precedence over whatever the workshop is currently offering.",
    session: "optional",
    responses: [
      {
        status: 200,
        description: "The workshop and the participant's situation on it.",
        schema: object(
          {
            id: text(),
            view: oneOf(...workshopViews),
            detail: contract("WorkshopDetail"),
            notice: contract("StatusNotice"),
            status: contract("StatusMessage")
          },
          ["id", "view", "detail"]
        )
      },
      { status: 404, description: "There is no such workshop." }
    ],
    handle: ({ database, params, participant }) => {
      const result = readWorkshopDetail(database, params.workshopId, participant?.id ?? null);
      if (result.outcome === "unknownWorkshop") return noSuchWorkshop();
      const { outcome, ...payload } = result;
      return answer(200, payload);
    }
  },

  {
    method: "POST",
    path: "/api/workshops/{workshopId}/registration/review",
    operationId: "reviewRegistrationDetails",
    tag: "Registration",
    summary: "Check registration details before booking",
    description:
      "Nothing is booked. Valid details come back as the summary to check over; details that cannot be acted on come back as the same form with a message against each field at fault.",
    session: "required",
    requestBody: { description: "The submitted registration details.", schema: contract("RegistrationForm") },
    responses: [
      {
        status: 200,
        description: "The details hold up; here is the summary to review.",
        schema: object({ outcome: oneOf("ready"), review: contract("RegistrationReview") }, ["outcome", "review"])
      },
      {
        status: 422,
        description: "The details cannot be acted on as they stand.",
        schema: object({ outcome: oneOf("invalidDetails"), form: contract("RegistrationForm") }, ["outcome", "form"])
      },
      { status: 404, description: "There is no such workshop." }
    ],
    handle: ({ database, params, body }) => {
      const result = reviewRegistrationDetails({ database, workshopId: params.workshopId, submitted: body });
      if (result.outcome === "unknownWorkshop") return noSuchWorkshop();
      return answer(result.outcome === "ready" ? 200 : 422, result);
    }
  },
  {
    method: "POST",
    path: "/api/workshops/{workshopId}/registration",
    operationId: "confirmRegistration",
    tag: "Registration",
    summary: "Book a place on a workshop",
    description:
      "Whether the place can be booked is decided at the moment the booking is written, not at the moment the form was filled in. A place that went to somebody else in between comes back as the workshop's current detail, from which the waitlist can be joined instead.",
    session: "required",
    requestBody: { description: "The reviewed registration details.", schema: contract("RegistrationForm") },
    responses: [
      {
        status: 200,
        description: "The place is booked, or was already held by this participant.",
        schema: outcomeSchema(["confirmed", "alreadyConfirmed"])
      },
      {
        status: 409,
        description: "The place went before the booking landed, or the workshop stopped taking entries.",
        schema: outcomeSchema(["placeUnavailable", "registrationClosed"], {
          id: text(),
          detail: contract("WorkshopDetail")
        })
      },
      {
        status: 422,
        description: "The details cannot be acted on as they stand.",
        schema: object({ outcome: oneOf("invalidDetails"), form: contract("RegistrationForm") }, ["outcome", "form"])
      },
      { status: 404, description: "There is no such workshop." }
    ],
    handle: ({ database, params, participant, body, now }) => {
      const result = confirmRegistration({
        database,
        workshopId: params.workshopId,
        participantId: participant.id,
        submitted: body,
        now
      });
      if (result.outcome === "unknownWorkshop") return noSuchWorkshop();
      return answer(submissionStatusCodes[result.outcome], result);
    }
  },

  {
    method: "POST",
    path: "/api/workshops/{workshopId}/waitlist/review",
    operationId: "reviewWaitlistDetails",
    tag: "Waitlist",
    summary: "Check waitlist details before joining",
    session: "required",
    requestBody: { description: "The submitted waitlist details.", schema: contract("WaitlistForm") },
    responses: [
      {
        status: 200,
        description: "The details hold up; here is the summary to review.",
        schema: object({ outcome: oneOf("ready"), review: contract("WaitlistReview") }, ["outcome", "review"])
      },
      {
        status: 422,
        description: "The details cannot be acted on as they stand.",
        schema: object({ outcome: oneOf("invalidDetails"), form: contract("WaitlistForm") }, ["outcome", "form"])
      },
      { status: 404, description: "There is no such workshop." }
    ],
    handle: ({ database, params, body }) => {
      const result = reviewWaitlistDetails({ database, workshopId: params.workshopId, submitted: body });
      if (result.outcome === "unknownWorkshop") return noSuchWorkshop();
      return answer(result.outcome === "ready" ? 200 : 422, result);
    }
  },
  {
    method: "POST",
    path: "/api/workshops/{workshopId}/waitlist",
    operationId: "joinWaitlist",
    tag: "Waitlist",
    summary: "Join a workshop's waitlist",
    session: "required",
    requestBody: { description: "The reviewed waitlist details.", schema: contract("WaitlistForm") },
    responses: [
      {
        status: 200,
        description: "The entry is recorded, or this participant was already on the list.",
        schema: outcomeSchema(["waitlisted", "alreadyWaitlisted"])
      },
      {
        status: 409,
        description: "The workshop stopped taking entries, or it is not offering a waitlist.",
        schema: outcomeSchema(["registrationClosed", "unsupported"])
      },
      {
        status: 422,
        description: "The details cannot be acted on as they stand.",
        schema: object({ outcome: oneOf("invalidDetails"), form: contract("WaitlistForm") }, ["outcome", "form"])
      },
      { status: 404, description: "There is no such workshop." }
    ],
    handle: ({ database, params, participant, body, now }) => {
      const result = joinWaitlist({
        database,
        workshopId: params.workshopId,
        participantId: participant.id,
        submitted: body,
        now
      });
      if (result.outcome === "unknownWorkshop") return noSuchWorkshop();
      return answer(submissionStatusCodes[result.outcome], result);
    }
  },
  {
    method: "GET",
    path: "/api/workshops/{workshopId}/waitlist",
    operationId: "readWaitlistStanding",
    tag: "Waitlist",
    summary: "Read this participant's waitlist standing",
    description:
      "A participant told they were already on the list carries on from here to the same standing a fresh entry would have given them.",
    session: "required",
    responses: [
      {
        status: 200,
        description: "The participant is on this workshop's waitlist.",
        schema: object(
          { outcome: oneOf("waitlisted"), id: text(), status: contract("StatusMessage") },
          ["outcome", "id", "status"]
        )
      },
      { status: 404, description: "There is no such workshop, or no waitlist standing on it." }
    ],
    handle: ({ database, params, participant }) => {
      const result = readWaitlistStanding(database, params.workshopId, participant.id);
      if (result.outcome === "unknownWorkshop") return noSuchWorkshop();
      if (result.outcome === "notWaitlisted") {
        return answer(404, problem("This participant is not on that workshop's waitlist."));
      }
      return answer(200, result);
    }
  },

  {
    method: "GET",
    path: "/api/offers",
    operationId: "listOfferedPlaces",
    tag: "Offered places",
    summary: "List the places offered to the signed-in participant",
    session: "required",
    responses: [
      {
        status: 200,
        description: "Every place offered to this participant.",
        schema: object(
          {
            offers: arrayOf(
              object({ id: text(), workshopTitle: text(), view: oneOf(...offerViews) }, [
                "id",
                "workshopTitle",
                "view"
              ])
            )
          },
          ["offers"]
        )
      }
    ],
    handle: ({ database, participant, now }) =>
      answer(200, { offers: readOfferedPlaces({ database, participantId: participant.id, now }) })
  },
  {
    method: "GET",
    path: "/api/offers/{offeredPlaceId}",
    operationId: "readOfferedPlace",
    tag: "Offered places",
    summary: "Open an offered place",
    description:
      "A place offered to somebody else is refused rather than described. An offer whose deadline has passed reads as run out, whether or not anything has swept it yet.",
    session: "required",
    responses: [
      {
        status: 200,
        description: "The offer, as it stands for this participant.",
        schema: object(
          {
            id: text(),
            view: oneOf(...offerViews),
            offer: contract("OfferSummary"),
            status: contract("StatusMessage")
          },
          ["id", "view"]
        )
      },
      { status: 403, description: "This place was offered to somebody else." },
      { status: 404, description: "There is no such offered place." }
    ],
    handle: ({ database, params, participant, now }) => {
      const result = readOfferedPlace({
        database,
        offeredPlaceId: params.offeredPlaceId,
        participantId: participant.id,
        now
      });
      if (result.outcome === "unknownOffer") return answer(404, problem("There is no such offered place."));
      if (result.outcome === "notPermitted") {
        return answer(403, problem("This place was offered to somebody else."));
      }
      const { outcome, ...payload } = result;
      return answer(200, payload);
    }
  },
  {
    method: "POST",
    path: "/api/offers/{offeredPlaceId}/accept",
    operationId: "acceptOfferedPlace",
    tag: "Offered places",
    summary: "Take an offered place",
    description:
      "Only the participant the place was offered to may take it, and taking it confirms that participant on that offer's workshop and no other.",
    session: "required",
    responses: [
      {
        status: 200,
        description: "The place is taken, or the offer had already been answered.",
        schema: outcomeSchema(["accepted", "alreadyAccepted", "alreadyDeclined"])
      },
      {
        status: 409,
        description: "The offer ran out or the place was withdrawn before the answer arrived.",
        schema: outcomeSchema(["expired", "unavailable"])
      },
      { status: 403, description: "This place was offered to somebody else." },
      { status: 404, description: "There is no such offered place." }
    ],
    handle: ({ database, params, participant, now }) =>
      offerAnswer(
        respondToOfferedPlace({
          database,
          offeredPlaceId: params.offeredPlaceId,
          participantId: participant.id,
          response: "accept",
          now
        })
      )
  },
  {
    method: "POST",
    path: "/api/offers/{offeredPlaceId}/decline",
    operationId: "declineOfferedPlace",
    tag: "Offered places",
    summary: "Pass on an offered place",
    description:
      "Only the participant the place was offered to may pass it on, and doing so leaves that participant's waitlist position on that offer's workshop exactly as it was.",
    session: "required",
    responses: [
      {
        status: 200,
        description: "The place was passed on, or the offer had already been answered.",
        schema: outcomeSchema(["declined", "alreadyDeclined", "alreadyAccepted"])
      },
      {
        status: 409,
        description: "The offer ran out or the place was withdrawn before the answer arrived.",
        schema: outcomeSchema(["expired", "unavailable"])
      },
      { status: 403, description: "This place was offered to somebody else." },
      { status: 404, description: "There is no such offered place." }
    ],
    handle: ({ database, params, participant, now }) =>
      offerAnswer(
        respondToOfferedPlace({
          database,
          offeredPlaceId: params.offeredPlaceId,
          participantId: participant.id,
          response: "decline",
          now
        })
      )
  },
  {
    method: "GET",
    path: "/api/offers/{offeredPlaceId}/message",
    operationId: "readOfferedPlaceMessage",
    tag: "Offered places",
    summary: "Render the message about an offered place",
    description:
      "Renders the message a participant is written to with while a place is being held for them, and hands it to the delivery stand-in. It is only produced while the offer is still waiting for an answer.",
    session: "required",
    responses: [
      {
        status: 200,
        description: "The rendered message, now recorded as delivered.",
        schema: messageSchema
      },
      {
        status: 409,
        description: "The offer is no longer waiting for an answer.",
        schema: outcomeSchema(["expired", "unavailable", "alreadyAccepted", "alreadyDeclined"])
      },
      { status: 403, description: "This place was offered to somebody else." },
      { status: 404, description: "There is no such offered place." }
    ],
    handle: ({ database, mailbox, appBaseUrl, params, participant, now }) => {
      const result = readOfferedPlace({
        database,
        offeredPlaceId: params.offeredPlaceId,
        participantId: participant.id,
        now
      });
      if (result.outcome === "unknownOffer") return answer(404, problem("There is no such offered place."));
      if (result.outcome === "notPermitted") {
        return answer(403, problem("This place was offered to somebody else."));
      }
      if (result.view !== "available") {
        return answer(409, {
          outcome: result.view === "accepted" ? "alreadyAccepted" : result.view === "declined" ? "alreadyDeclined" : result.view,
          effectApplied: false,
          status: result.status
        });
      }
      const rendered = renderOfferEmail({
        summary: result.offer,
        href: offerLink(appBaseUrl, result.id)
      });
      return answer(
        200,
        mailbox.deliver({
          participantId: participant.id,
          to: participant.email,
          subject: rendered.subject,
          html: rendered.html,
          deliveredAt: now
        })
      );
    }
  },

  {
    method: "GET",
    path: "/api/mailbox",
    operationId: "readMailbox",
    tag: "Offered places",
    summary: "Read what the delivery stand-in has been handed",
    description:
      "Nothing leaves the process. This is where the messages the signed-in participant would have received can be read back.",
    session: "required",
    responses: [
      {
        status: 200,
        description: "Everything delivered to this participant, newest first.",
        schema: object({ messages: arrayOf(messageSchema) }, ["messages"])
      }
    ],
    handle: ({ mailbox, participant }) => answer(200, { messages: mailbox.read(participant.id) })
  }
]);
