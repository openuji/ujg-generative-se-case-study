const string = { type: "string" };

const object = (required, properties) => ({
  type: "object",
  ...(required.length > 0 ? { required } : {}),
  properties,
  additionalProperties: false
});

const outcome = (name, data) => object(["outcome", "data"], {
  outcome: { type: "string", const: name },
  data
});

const outcomes = (...variants) => ({ oneOf: variants });

const workshopTeaserData = object(["title", "summary", "date", "location"], {
  title: string,
  summary: string,
  date: string,
  location: string
});

const workshopDetailData = object(["title", "description", "date", "location", "availability"], {
  title: string,
  description: string,
  date: string,
  location: string,
  availability: string
});

const statusMessageData = object(["title", "message"], {
  title: string,
  message: string,
  tone: { type: "string", enum: ["error", "info", "success", "warning"] },
  details: {
    type: "array",
    items: object(["term", "value"], { term: string, value: string })
  }
});

const statusNoticeData = object(["message"], {
  message: string,
  tone: { type: "string", enum: ["error", "info", "success", "warning"] }
});

const offerSummaryData = object(["title", "message", "workshopTitle", "expiresAt"], {
  title: string,
  message: string,
  workshopTitle: string,
  expiresAt: string
});

const registrationDetailsInput = object(["name", "email"], {
  name: string,
  email: string,
  accessibilityNotes: string
});

const waitlistDetailsInput = object(["name", "email"], {
  name: string,
  email: string,
  notes: string
});

const workshopCollectionData = object(["items"], {
  items: {
    type: "array",
    items: object(["workshopId", "data"], {
      workshopId: string,
      data: workshopTeaserData
    })
  }
});

const workshopDetailWithNoticeData = object(["summary", "notice"], {
  summary: workshopDetailData,
  notice: statusNoticeData
});

export const operations = [
  {
    operationId: "listWorkshops",
    method: "GET",
    path: "/api/workshops",
    auth: false,
    responseSchema: outcomes(outcome("overview", workshopCollectionData))
  },
  {
    operationId: "getWorkshop",
    method: "GET",
    path: "/api/workshops/{workshopId}",
    auth: true,
    responseSchema: outcomes(
      outcome("alreadyRegistered", workshopDetailWithNoticeData),
      outcome("alreadyWaitlisted", workshopDetailWithNoticeData),
      outcome("registrationOpen", workshopDetailData),
      outcome("waitlistOpen", workshopDetailData),
      outcome("registrationClosed", statusMessageData)
    )
  },
  {
    operationId: "confirmRegistration",
    method: "POST",
    path: "/api/workshops/{workshopId}/registrations",
    auth: true,
    requestSchema: registrationDetailsInput,
    responseSchema: outcomes(
      outcome("alreadyConfirmed", statusMessageData),
      outcome("confirmed", statusMessageData),
      outcome("waitlistOpen", workshopDetailData),
      outcome("registrationClosed", statusMessageData)
    )
  },
  {
    operationId: "joinWaitlist",
    method: "POST",
    path: "/api/workshops/{workshopId}/waitlist",
    auth: true,
    requestSchema: waitlistDetailsInput,
    responseSchema: outcomes(
      outcome("waitlisted", statusMessageData),
      outcome("alreadyWaitlisted", statusMessageData),
      outcome("registrationClosed", statusMessageData)
    )
  },
  {
    operationId: "getOffer",
    method: "GET",
    path: "/api/offers/{offerId}",
    auth: true,
    responseSchema: outcomes(
      outcome("open", offerSummaryData),
      outcome("expired", statusMessageData),
      outcome("unavailable", statusMessageData),
      outcome("accepted", statusMessageData),
      outcome("declined", statusMessageData)
    )
  },
  {
    operationId: "acceptOffer",
    method: "POST",
    path: "/api/offers/{offerId}/accept",
    auth: true,
    responseSchema: outcomes(
      outcome("accepted", statusMessageData),
      outcome("expired", statusMessageData),
      outcome("unavailable", statusMessageData)
    )
  },
  {
    operationId: "declineOffer",
    method: "POST",
    path: "/api/offers/{offerId}/decline",
    auth: true,
    responseSchema: outcomes(
      outcome("declined", statusMessageData),
      outcome("expired", statusMessageData),
      outcome("unavailable", statusMessageData)
    )
  }
];
