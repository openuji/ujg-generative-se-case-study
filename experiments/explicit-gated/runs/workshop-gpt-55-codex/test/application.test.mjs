import assert from "node:assert/strict";
import test from "node:test";
import {
  createFakeEmailClient,
  createWorkshopStore,
  openApiDocument,
  validateRegistrationDetails,
  validateWaitlistDetails
} from "../apps/domain/src/main.mjs";

const fixedNow = () => new Date("2026-09-08T10:00:00.000Z");

const validRegistration = {
  name: "Maya Chen",
  email: "maya@example.com",
  accessibilityNotes: "A quiet seat near the front is helpful."
};

const validWaitlist = {
  name: "Maya Chen",
  email: "maya@example.com",
  notes: "Remote attendance is also possible."
};

function makeStore() {
  return createWorkshopStore({ now: fixedNow });
}

test("detail entry materialization follows participant and workshop facts", () => {
  const store = makeStore();
  try {
    const workshops = store.listWorkshops();
    assert.equal(workshops.find((workshop) => workshop.slug === "product-discovery-sprint")?.entry, "registrationOpen");
    assert.equal(workshops.find((workshop) => workshop.slug === "journey-mapping-lab")?.entry, "waitlistOpen");
    assert.equal(workshops.find((workshop) => workshop.slug === "research-ops-foundations")?.entry, "alreadyRegistered");
    assert.equal(workshops.find((workshop) => workshop.slug === "service-blueprinting")?.entry, "alreadyWaitlisted");
    assert.equal(workshops.find((workshop) => workshop.slug === "facilitation-retrospective")?.entry, "registrationClosed");

    assert.equal(store.materializeWorkshop("product-discovery-sprint").view, "registrationOpen");
    assert.equal(store.materializeWorkshop("journey-mapping-lab").view, "waitlistOpen");
    assert.equal(store.materializeWorkshop("research-ops-foundations").view, "alreadyRegistered");
    assert.equal(store.materializeWorkshop("service-blueprinting").view, "alreadyWaitlisted");
    assert.equal(store.materializeWorkshop("facilitation-retrospective").view, "registrationClosed");
  } finally {
    store.close();
  }
});

test("detail validation separates correction from review", () => {
  assert.equal(validateRegistrationDetails({ name: "", email: "missing" }).valid, false);
  assert.deepEqual(validateRegistrationDetails(validRegistration).errors, {});
  assert.equal(validateWaitlistDetails({ name: "", email: "missing" }).valid, false);
  assert.deepEqual(validateWaitlistDetails(validWaitlist).errors, {});
});

test("registration confirmation is atomic and idempotent", () => {
  const store = makeStore();
  try {
    assert.equal(store.countRegistrations("product-discovery-sprint"), 0);
    const confirmed = store.confirmRegistration("product-discovery-sprint", validRegistration);
    assert.equal(confirmed.view, "registrationConfirmed");
    assert.equal(store.countRegistrations("product-discovery-sprint"), 1);

    const repeated = store.confirmRegistration("product-discovery-sprint", validRegistration);
    assert.equal(repeated.view, "registrationAlreadyConfirmed");
    assert.equal(store.countRegistrations("product-discovery-sprint"), 1);
  } finally {
    store.close();
  }
});

test("registration confirmation keeps unavailable and closed branches distinct", () => {
  const store = makeStore();
  try {
    store.setWorkshopState("product-discovery-sprint", { capacity: 0, registrationOpen: true, waitlistOpen: true });
    const unavailable = store.confirmRegistration("product-discovery-sprint", validRegistration);
    assert.equal(unavailable.view, "waitlistPrompt");
    assert.equal(store.countRegistrations("product-discovery-sprint"), 0);

    store.setWorkshopState("product-discovery-sprint", { registrationOpen: false, waitlistOpen: false });
    const closed = store.confirmRegistration("product-discovery-sprint", validRegistration, "new-participant");
    assert.equal(closed.view, "registrationClosed");
    assert.equal(store.countRegistrations("product-discovery-sprint"), 0);
  } finally {
    store.close();
  }
});

test("competing registration commands re-evaluate availability before effects", () => {
  const store = makeStore();
  try {
    store.setWorkshopState("product-discovery-sprint", { capacity: 1, registrationOpen: true, waitlistOpen: true });
    assert.equal(store.confirmRegistration("product-discovery-sprint", validRegistration, "first-participant").view, "registrationConfirmed");
    assert.equal(store.confirmRegistration("product-discovery-sprint", validRegistration, "second-participant").view, "waitlistPrompt");
    assert.equal(store.countRegistrations("product-discovery-sprint"), 1);
  } finally {
    store.close();
  }
});

test("waitlist join handles effect, repeat, and closed outcomes", () => {
  const store = makeStore();
  try {
    assert.equal(store.joinWaitlist("journey-mapping-lab", validWaitlist).view, "waitlisted");
    assert.equal(store.countWaitlist("journey-mapping-lab"), 1);
    assert.equal(store.joinWaitlist("journey-mapping-lab", validWaitlist).view, "alreadyWaitlisted");
    assert.equal(store.countWaitlist("journey-mapping-lab"), 1);

    assert.equal(store.joinWaitlist("facilitation-retrospective", validWaitlist, "new-participant").view, "registrationClosed");
    assert.equal(store.countWaitlist("facilitation-retrospective"), 0);
  } finally {
    store.close();
  }
});

test("offer email and response branches remain separate", () => {
  const store = makeStore();
  try {
    const emailClient = createFakeEmailClient({ store, origin: "https://workshops.example" });
    const email = emailClient.sendOffer("offer-current");
    assert.equal(email.to, "maya@example.com");
    assert.equal(email.href, "https://workshops.example/?offer=offer-current");
    assert.equal(emailClient.outbox().length, 1);

    assert.equal(store.materializeOffer("offer-current").view, "offerOpen");
    assert.equal(store.acceptOffer("offer-current").view, "offerAccepted");
    assert.equal(store.acceptOffer("offer-current").view, "offerAccepted");
    assert.equal(store.countRegistrations("service-blueprinting"), 2);
  } finally {
    store.close();
  }
});

test("offer expiry, unavailability, and decline do not collapse into one outcome", () => {
  const store = makeStore();
  try {
    store.createOffer({
      id: "expired-offer",
      workshopSlug: "product-discovery-sprint",
      expiresAt: "2026-09-07T10:00:00.000Z"
    });
    assert.equal(store.materializeOffer("expired-offer").view, "offerExpired");
    assert.equal(store.acceptOffer("expired-offer").view, "offerExpired");

    store.createOffer({
      id: "unavailable-offer",
      workshopSlug: "product-discovery-sprint",
      participantId: "another-participant",
      expiresAt: "2026-12-15T12:00:00.000Z"
    });
    store.setWorkshopState("product-discovery-sprint", { capacity: 0, registrationOpen: true, waitlistOpen: true });
    assert.equal(store.acceptOffer("unavailable-offer").view, "offerUnavailable");

    store.createOffer({
      id: "declined-offer",
      workshopSlug: "research-ops-foundations",
      participantId: "declining-participant",
      expiresAt: "2026-12-15T12:00:00.000Z"
    });
    assert.equal(store.declineOffer("declined-offer").view, "offerDeclined");
    assert.equal(store.materializeOffer("declined-offer").view, "offerDeclined");
  } finally {
    store.close();
  }
});

test("transport documentation is derived from the implemented route registry", () => {
  const document = openApiDocument();
  assert.equal(document.openapi, "3.1.0");
  assert.ok(document.paths["/api/workshops"]);
  assert.ok(document.paths["/api/offers/{offerId}/accept"]);
  assert.ok(document.paths["/docs"]);
});
