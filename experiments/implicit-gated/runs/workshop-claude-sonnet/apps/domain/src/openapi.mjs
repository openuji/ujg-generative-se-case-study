export function openApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Workshop registration API",
      version: "1.0.0",
      description: "Registration, waitlist, and offered-place API for the workshop application."
    },
    paths: {
      "/api/workshops": {
        get: {
          summary: "List workshops",
          responses: {
            200: {
              description: "Workshop teasers",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/WorkshopTeaser" }
                  }
                }
              }
            }
          }
        }
      },
      "/api/workshops/{workshopId}": {
        get: {
          summary: "Get workshop detail for the current participant",
          parameters: [{ name: "workshopId", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: {
              description: "Workshop detail",
              content: { "application/json": { schema: { $ref: "#/components/schemas/WorkshopDetail" } } }
            },
            404: { description: "Workshop not found" }
          }
        }
      },
      "/api/workshops/{workshopId}/registration": {
        post: {
          summary: "Confirm registration for a workshop",
          parameters: [{ name: "workshopId", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/RegistrationSubmission" } }
            }
          },
          responses: {
            200: {
              description: "Registration outcome",
              content: { "application/json": { schema: { $ref: "#/components/schemas/RegistrationOutcome" } } }
            }
          }
        }
      },
      "/api/workshops/{workshopId}/waitlist": {
        post: {
          summary: "Join the waitlist for a workshop",
          parameters: [{ name: "workshopId", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/WaitlistSubmission" } }
            }
          },
          responses: {
            200: {
              description: "Waitlist outcome",
              content: { "application/json": { schema: { $ref: "#/components/schemas/WaitlistOutcome" } } }
            }
          }
        }
      },
      "/api/offers/{offerId}": {
        get: {
          summary: "Get an offered place",
          parameters: [{ name: "offerId", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: {
              description: "Offer detail",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Offer" } } }
            },
            404: { description: "Offer not found" }
          }
        }
      },
      "/api/offers/{offerId}/accept": {
        post: {
          summary: "Accept an offered place",
          parameters: [{ name: "offerId", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: {
              description: "Acceptance outcome",
              content: { "application/json": { schema: { $ref: "#/components/schemas/OfferOutcome" } } }
            }
          }
        }
      },
      "/api/offers/{offerId}/decline": {
        post: {
          summary: "Decline an offered place",
          parameters: [{ name: "offerId", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: {
              description: "Decline outcome",
              content: { "application/json": { schema: { $ref: "#/components/schemas/OfferOutcome" } } }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        WorkshopTeaser: {
          type: "object",
          required: ["id", "title", "summary", "date", "location"],
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            summary: { type: "string" },
            date: { type: "string" },
            location: { type: "string" }
          }
        },
        WorkshopDetail: {
          type: "object",
          required: ["id", "title", "description", "date", "location", "availability", "participantStatus"],
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            date: { type: "string" },
            location: { type: "string" },
            availability: { enum: ["placeAvailable", "waitlistOpen", "registrationClosed"] },
            participantStatus: { enum: ["none", "confirmed", "waitlisted"] }
          }
        },
        RegistrationSubmission: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" },
            accessibilityNotes: { type: "string" }
          }
        },
        RegistrationOutcome: {
          type: "object",
          required: ["outcome"],
          properties: {
            outcome: { enum: ["confirmed", "alreadyRegistered", "placeUnavailable", "registrationClosed"] },
            workshop: { $ref: "#/components/schemas/WorkshopDetail" }
          }
        },
        WaitlistSubmission: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" },
            notes: { type: "string" }
          }
        },
        WaitlistOutcome: {
          type: "object",
          required: ["outcome"],
          properties: {
            outcome: { enum: ["waitlisted", "alreadyWaitlisted", "registrationClosed"] },
            workshop: { $ref: "#/components/schemas/WorkshopDetail" }
          }
        },
        Offer: {
          type: "object",
          required: ["id", "status", "expiresAt", "workshopTitle"],
          properties: {
            id: { type: "string" },
            status: { enum: ["open", "expired", "accepted", "declined"] },
            expiresAt: { type: "string" },
            workshopTitle: { type: "string" }
          }
        },
        OfferOutcome: {
          type: "object",
          required: ["outcome"],
          properties: {
            outcome: { enum: ["confirmed", "waitlisted", "expired", "unavailable"] }
          }
        }
      }
    }
  };
}
