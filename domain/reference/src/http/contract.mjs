const refs = {
  entries: {
    workshopsOverview: "urn:ujg:entry-binding:workshops-overview",
    workshopDetail: "urn:ujg:entry-binding:workshop-detail",
    offeredPlace: "urn:ujg:entry-binding:offered-place-app"
  },
  commands: {
    confirmRegistration: "urn:ujg:command:confirm-registration",
    joinWaitlist: "urn:ujg:command:join-waitlist",
    acceptOffer: "urn:ujg:command:accept-offered-place",
    declineOffer: "urn:ujg:command:decline-offered-place"
  },
  conditionSets: {
    confirmRegistration: "urn:ujg:condition-set:registration-place-at-confirmation",
    joinWaitlist: "urn:ujg:condition-set:waitlist-join-at-submission",
    acceptOffer: "urn:ujg:condition-set:offered-place-acceptance-validity",
    declineOffer: "urn:ujg:condition-set:offered-place-decline-status"
  }
};

export const dataSchemas = {
  WorkshopTeaserData: "ujg/schemas/workshop-teaser-data.schema.json",
  WorkshopDetailData: "ujg/schemas/workshop-detail-data.schema.json",
  RegistrationFormData: "ujg/schemas/registration-form-data.schema.json",
  WaitlistFormData: "ujg/schemas/waitlist-form-data.schema.json",
  RegistrationReviewData: "ujg/schemas/registration-review-data.schema.json",
  WaitlistReviewData: "ujg/schemas/waitlist-review-data.schema.json",
  OfferSummaryData: "ujg/schemas/offer-summary-data.schema.json",
  StatusMessageData: "ujg/schemas/status-message-data.schema.json"
};

const outcome = (name, stateRef, transitionRef, dataSchema) => ({
  name,
  stateRef,
  ...(transitionRef ? { transitionRef } : {}),
  dataSchema
});

export const operations = [
  {
    operationId: "listWorkshops",
    method: "get",
    path: "/api/workshops",
    summary: "Materialize the workshops overview",
    entryRef: refs.entries.workshopsOverview,
    auth: false,
    responseSchema: "WorkshopCollectionResponse",
    outcomes: [
      outcome("overview", "urn:ujg:state:workshops-overview", null, "WorkshopCollectionData")
    ]
  },
  {
    operationId: "getWorkshop",
    method: "get",
    path: "/api/workshops/{workshopId}",
    summary: "Materialize the current workshop detail entry",
    entryRef: refs.entries.workshopDetail,
    auth: false,
    parameters: [{ name: "workshopId", in: "path", required: true, schema: { type: "string", minLength: 1 } }],
    responseSchema: "WorkshopDetailResponse",
    outcomes: [
      outcome("registrationOpen", "urn:ujg:state:workshop-registration-open", null, "WorkshopDetailData"),
      outcome("waitlistOpen", "urn:ujg:state:workshop-waitlist-open", null, "WorkshopDetailData"),
      outcome("registrationClosed", "urn:ujg:state:workshop-registration-closed", null, "StatusMessageData")
    ]
  },
  {
    operationId: "confirmRegistration",
    method: "post",
    path: "/api/workshops/{workshopId}/registrations",
    summary: "Confirm registration against current workshop facts",
    commandRef: refs.commands.confirmRegistration,
    conditionSetRef: refs.conditionSets.confirmRegistration,
    auth: true,
    parameters: [{ name: "workshopId", in: "path", required: true, schema: { type: "string", minLength: 1 } }],
    requestSchema: "RegistrationDetailsInput",
    inputDataSchemaRef: "urn:ujg:data-schema:registration-form-data",
    responseSchema: "RegistrationOutcomeResponse",
    outcomes: [
      outcome("confirmed", "urn:ujg:state:registration-confirmed", "urn:ujg:transition:confirm-registration", "StatusMessageData"),
      outcome("waitlistOpen", "urn:ujg:state:waitlist-after-registration-unavailable", "urn:ujg:transition:confirm-registration-place-unavailable", "WorkshopDetailData"),
      outcome("registrationClosed", "urn:ujg:state:workshop-registration-closed", "urn:ujg:transition:confirm-registration-closed", "StatusMessageData")
    ]
  },
  {
    operationId: "joinWaitlist",
    method: "post",
    path: "/api/workshops/{workshopId}/waitlist",
    summary: "Join the waitlist against current workshop and participation facts",
    commandRef: refs.commands.joinWaitlist,
    conditionSetRef: refs.conditionSets.joinWaitlist,
    auth: true,
    parameters: [{ name: "workshopId", in: "path", required: true, schema: { type: "string", minLength: 1 } }],
    requestSchema: "WaitlistDetailsInput",
    inputDataSchemaRef: "urn:ujg:data-schema:waitlist-form-data",
    responseSchema: "WaitlistOutcomeResponse",
    outcomes: [
      outcome("waitlisted", "urn:ujg:state:waitlisted", "urn:ujg:transition:join-waitlist", "StatusMessageData"),
      outcome("alreadyWaitlisted", "urn:ujg:state:already-waitlisted", "urn:ujg:transition:join-waitlist-already-listed", "StatusMessageData"),
      outcome("registrationClosed", "urn:ujg:state:workshop-registration-closed", "urn:ujg:transition:join-waitlist-after-closed", "StatusMessageData")
    ]
  },
  {
    operationId: "getOffer",
    method: "get",
    path: "/api/offers/{offerId}",
    summary: "Materialize an offered place for its authenticated subject",
    entryRef: refs.entries.offeredPlace,
    auth: true,
    parameters: [{ name: "offerId", in: "path", required: true, schema: { type: "string", minLength: 1 } }],
    responseSchema: "OfferResponse",
    outcomes: [
      outcome("open", "urn:ujg:state:offered-place-open", null, "OfferSummaryData"),
      outcome("expired", "urn:ujg:state:offered-place-expired", null, "StatusMessageData"),
      outcome("unavailable", "urn:ujg:state:offered-place-unavailable", null, "StatusMessageData"),
      outcome("accepted", "urn:ujg:state:offered-place-registration-confirmed", null, "StatusMessageData"),
      outcome("declined", "urn:ujg:state:offered-place-waitlisted", null, "StatusMessageData")
    ]
  },
  {
    operationId: "acceptOffer",
    method: "post",
    path: "/api/offers/{offerId}/accept",
    summary: "Accept an offered place when it is currently valid",
    commandRef: refs.commands.acceptOffer,
    conditionSetRef: refs.conditionSets.acceptOffer,
    auth: true,
    parameters: [{ name: "offerId", in: "path", required: true, schema: { type: "string", minLength: 1 } }],
    responseSchema: "AcceptOfferOutcomeResponse",
    outcomes: [
      outcome("accepted", "urn:ujg:state:offered-place-registration-confirmed", "urn:ujg:transition:accept-offered-place", "StatusMessageData"),
      outcome("expired", "urn:ujg:state:offered-place-expired", "urn:ujg:transition:accept-offered-place-after-expiry", "StatusMessageData"),
      outcome("unavailable", "urn:ujg:state:offered-place-unavailable", "urn:ujg:transition:accept-offered-place-after-unavailable", "StatusMessageData")
    ]
  },
  {
    operationId: "declineOffer",
    method: "post",
    path: "/api/offers/{offerId}/decline",
    summary: "Decline an offered place when it is currently valid",
    commandRef: refs.commands.declineOffer,
    conditionSetRef: refs.conditionSets.declineOffer,
    auth: true,
    parameters: [{ name: "offerId", in: "path", required: true, schema: { type: "string", minLength: 1 } }],
    responseSchema: "DeclineOfferOutcomeResponse",
    outcomes: [
      outcome("declined", "urn:ujg:state:offered-place-waitlisted", "urn:ujg:transition:decline-offered-place", "StatusMessageData"),
      outcome("expired", "urn:ujg:state:offered-place-expired", "urn:ujg:transition:decline-offered-place-after-expiry", "StatusMessageData"),
      outcome("unavailable", "urn:ujg:state:offered-place-unavailable", "urn:ujg:transition:decline-offered-place-after-unavailable", "StatusMessageData")
    ]
  }
];

export const contractRefs = refs;
