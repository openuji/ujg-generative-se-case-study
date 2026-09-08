import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";

const defaultParticipantId = "current-participant";
const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, x-participant-id"
};

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"]
]);

const seededWorkshops = [
  {
    slug: "product-discovery-sprint",
    title: "Product Discovery Sprint",
    summary: "A compact workshop for aligning research, framing, and decision points.",
    description: "Work through opportunity framing, interview synthesis, and decision checkpoints with a small cohort.",
    date: "October 14, 2026",
    location: "Berlin studio",
    capacity: 3,
    registrationOpen: true,
    waitlistOpen: true
  },
  {
    slug: "service-blueprinting",
    title: "Service Blueprinting",
    summary: "Map frontstage, backstage, and support processes around a real service.",
    description: "Build a service blueprint from customer actions through operational ownership and friction points.",
    date: "October 21, 2026",
    location: "Remote",
    capacity: 2,
    registrationOpen: true,
    waitlistOpen: true
  },
  {
    slug: "journey-mapping-lab",
    title: "Journey Mapping Lab",
    summary: "Practice turning raw observations into a usable journey map.",
    description: "Shape research notes into stages, needs, evidence, and opportunity areas for a live case.",
    date: "November 4, 2026",
    location: "Hamburg campus",
    capacity: 1,
    registrationOpen: true,
    waitlistOpen: true
  },
  {
    slug: "research-ops-foundations",
    title: "Research Ops Foundations",
    summary: "Design intake, recruitment, consent, and repository practices for teams.",
    description: "Create a research operations baseline that can scale across squads without blocking learning.",
    date: "November 18, 2026",
    location: "Munich hub",
    capacity: 3,
    registrationOpen: true,
    waitlistOpen: false
  },
  {
    slug: "facilitation-retrospective",
    title: "Facilitation Retrospective",
    summary: "Registration has closed for this facilitation practice workshop.",
    description: "A closed cohort for improving facilitation through critique, rehearsal, and reflection.",
    date: "September 30, 2026",
    location: "Remote",
    capacity: 2,
    registrationOpen: false,
    waitlistOpen: false
  }
];

function nowIso(now) {
  return now().toISOString();
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function onePlaceLabel(count) {
  return count === 1 ? "1 place available" : `${count} places available`;
}

function rowToWorkshop(row) {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    description: row.description,
    date: row.event_date,
    location: row.location,
    capacity: Number(row.capacity),
    registrationOpen: Boolean(row.registration_open),
    waitlistOpen: Boolean(row.waitlist_open)
  };
}

function rowToOffer(row) {
  return {
    id: row.id,
    workshopSlug: row.workshop_slug,
    participantId: row.participant_id,
    status: row.status,
    expiresAt: row.expires_at
  };
}

function detailData(workshop, availability) {
  return {
    title: workshop.title,
    description: workshop.description,
    date: workshop.date,
    location: workshop.location,
    availability
  };
}

function teaserData(workshop) {
  return {
    slug: workshop.slug,
    title: workshop.title,
    summary: workshop.summary,
    date: workshop.date,
    location: workshop.location
  };
}

function offerData(offer, workshop) {
  return {
    title: "A workshop place is available",
    message: "A place opened from the waitlist. Please accept or decline before the response deadline.",
    workshopTitle: workshop.title,
    expiresAt: new Date(offer.expiresAt).toLocaleString("en", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC"
    })
  };
}

function registrationDetails(details) {
  return [
    { term: "Workshop", value: details.workshopTitle },
    { term: "Name", value: details.name },
    { term: "Email", value: details.email }
  ];
}

function message(title, messageText, tone = "info", details = []) {
  return { title, message: messageText, tone, details };
}

function createRegistrationStatus(workshop, details) {
  return message(
    "Registration confirmed",
    "Your place is confirmed for this workshop.",
    "success",
    registrationDetails({
      workshopTitle: workshop.title,
      name: details.name,
      email: details.email
    })
  );
}

function createAlreadyRegisteredStatus(workshop) {
  return message(
    "Registration already confirmed",
    "You already have a confirmed place for this workshop.",
    "info",
    [{ term: "Workshop", value: workshop.title }]
  );
}

function createWaitlistedStatus(workshop, details) {
  return message(
    "Waitlist request received",
    "You are on the waitlist for this workshop.",
    "success",
    registrationDetails({
      workshopTitle: workshop.title,
      name: details.name,
      email: details.email
    })
  );
}

function createAlreadyWaitlistedStatus(workshop) {
  return message(
    "Already on the waitlist",
    "You already have a waitlist request for this workshop.",
    "info",
    [{ term: "Workshop", value: workshop.title }]
  );
}

function createClosedStatus(workshop) {
  return message(
    "Registration closed",
    "Registration and waitlist requests are no longer available for this workshop.",
    "warning",
    [{ term: "Workshop", value: workshop.title }]
  );
}

function createOfferAcceptedStatus(workshop) {
  return message(
    "Registration confirmed",
    "Your offered place has been accepted and your workshop registration is confirmed.",
    "success",
    [{ term: "Workshop", value: workshop.title }]
  );
}

function createOfferDeclinedStatus(workshop) {
  return message(
    "You remain on the waitlist",
    "The offered place was declined and your waitlist request remains active.",
    "info",
    [{ term: "Workshop", value: workshop.title }]
  );
}

function createOfferExpiredStatus(workshop) {
  return message(
    "Offer expired",
    "The response deadline for this offered place has passed.",
    "warning",
    [{ term: "Workshop", value: workshop.title }]
  );
}

function createOfferUnavailableStatus(workshop) {
  return message(
    "Place unavailable",
    "The offered place is no longer available.",
    "error",
    [{ term: "Workshop", value: workshop.title }]
  );
}

export function validateRegistrationDetails(input = {}) {
  const values = {
    name: normalizeText(input.name),
    email: normalizeEmail(input.email),
    accessibilityNotes: normalizeText(input.accessibilityNotes)
  };
  const errors = {};
  if (!values.name) errors.name = "Enter your full name.";
  if (!isValidEmail(values.email)) errors.email = "Enter a valid email address.";
  return {
    valid: Object.keys(errors).length === 0,
    values,
    errors
  };
}

export function validateWaitlistDetails(input = {}) {
  const values = {
    name: normalizeText(input.name),
    email: normalizeEmail(input.email),
    notes: normalizeText(input.notes)
  };
  const errors = {};
  if (!values.name) errors.name = "Enter your full name.";
  if (!isValidEmail(values.email)) errors.email = "Enter a valid email address.";
  return {
    valid: Object.keys(errors).length === 0,
    values,
    errors
  };
}

export function createWorkshopStore({ databasePath = ":memory:", now = () => new Date(), seed = true } = {}) {
  const db = new DatabaseSync(databasePath);
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS workshops (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      description TEXT NOT NULL,
      event_date TEXT NOT NULL,
      location TEXT NOT NULL,
      capacity INTEGER NOT NULL CHECK (capacity >= 0),
      registration_open INTEGER NOT NULL CHECK (registration_open IN (0, 1)),
      waitlist_open INTEGER NOT NULL CHECK (waitlist_open IN (0, 1))
    );
    CREATE TABLE IF NOT EXISTS registrations (
      workshop_slug TEXT NOT NULL REFERENCES workshops(slug),
      participant_id TEXT NOT NULL REFERENCES participants(id),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      accessibility_notes TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (workshop_slug, participant_id)
    );
    CREATE TABLE IF NOT EXISTS waitlist (
      workshop_slug TEXT NOT NULL REFERENCES workshops(slug),
      participant_id TEXT NOT NULL REFERENCES participants(id),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      notes TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (workshop_slug, participant_id)
    );
    CREATE TABLE IF NOT EXISTS offers (
      id TEXT PRIMARY KEY,
      workshop_slug TEXT NOT NULL REFERENCES workshops(slug),
      participant_id TEXT NOT NULL REFERENCES participants(id),
      status TEXT NOT NULL CHECK (status IN ('open', 'accepted', 'declined', 'expired')),
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const statements = {
    insertParticipant: db.prepare("INSERT OR IGNORE INTO participants (id, name, email) VALUES (?, ?, ?)"),
    insertWorkshop: db.prepare(`
      INSERT OR IGNORE INTO workshops (
        slug, title, summary, description, event_date, location, capacity, registration_open, waitlist_open
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    insertRegistration: db.prepare(`
      INSERT OR IGNORE INTO registrations (
        workshop_slug, participant_id, name, email, accessibility_notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `),
    insertWaitlist: db.prepare(`
      INSERT OR IGNORE INTO waitlist (
        workshop_slug, participant_id, name, email, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `),
    deleteWaitlist: db.prepare("DELETE FROM waitlist WHERE workshop_slug = ? AND participant_id = ?"),
    insertOffer: db.prepare(`
      INSERT OR IGNORE INTO offers (id, workshop_slug, participant_id, status, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `),
    updateOfferStatus: db.prepare("UPDATE offers SET status = ? WHERE id = ?"),
    workshopBySlug: db.prepare("SELECT * FROM workshops WHERE slug = ?"),
    offerById: db.prepare("SELECT * FROM offers WHERE id = ?"),
    registrationByParticipant: db.prepare("SELECT * FROM registrations WHERE workshop_slug = ? AND participant_id = ?"),
    waitlistByParticipant: db.prepare("SELECT * FROM waitlist WHERE workshop_slug = ? AND participant_id = ?"),
    registrationCount: db.prepare("SELECT COUNT(*) AS count FROM registrations WHERE workshop_slug = ?"),
    updateWorkshop: db.prepare(`
      UPDATE workshops
      SET capacity = COALESCE(?, capacity),
          registration_open = COALESCE(?, registration_open),
          waitlist_open = COALESCE(?, waitlist_open)
      WHERE slug = ?
    `)
  };

  function withTransaction(callback) {
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = callback();
      db.exec("COMMIT");
      return result;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  function ensureParticipant(participantId = defaultParticipantId) {
    statements.insertParticipant.run(participantId, "Maya Chen", "maya@example.com");
  }

  function requireWorkshop(slug) {
    const row = statements.workshopBySlug.get(slug);
    if (!row) {
      const error = new Error("Workshop not found.");
      error.status = 404;
      throw error;
    }
    return rowToWorkshop(row);
  }

  function requireOffer(offerId) {
    const row = statements.offerById.get(offerId);
    if (!row) {
      const error = new Error("Offer not found.");
      error.status = 404;
      throw error;
    }
    return refreshOffer(rowToOffer(row));
  }

  function registrationCount(slug) {
    return Number(statements.registrationCount.get(slug).count);
  }

  function remainingPlaces(workshop) {
    return Math.max(0, workshop.capacity - registrationCount(workshop.slug));
  }

  function isRegistered(slug, participantId) {
    return Boolean(statements.registrationByParticipant.get(slug, participantId));
  }

  function isWaitlisted(slug, participantId) {
    return Boolean(statements.waitlistByParticipant.get(slug, participantId));
  }

  function availabilityFor(workshop, participantId = defaultParticipantId) {
    if (isRegistered(workshop.slug, participantId)) return "You are registered";
    if (isWaitlisted(workshop.slug, participantId)) return "You are on the waitlist";
    if (!workshop.registrationOpen) return "Registration closed";
    const places = remainingPlaces(workshop);
    if (places > 0) return onePlaceLabel(places);
    if (workshop.waitlistOpen) return "Registration full; waitlist available";
    return "Registration closed";
  }

  function entryFor(workshop, participantId = defaultParticipantId) {
    if (isRegistered(workshop.slug, participantId)) return "alreadyRegistered";
    if (isWaitlisted(workshop.slug, participantId)) return "alreadyWaitlisted";
    if (!workshop.registrationOpen) return "registrationClosed";
    if (remainingPlaces(workshop) > 0) return "registrationOpen";
    if (workshop.waitlistOpen) return "waitlistOpen";
    return "registrationClosed";
  }

  function refreshOffer(offer) {
    if (offer.status === "open" && Date.parse(offer.expiresAt) <= now().getTime()) {
      statements.updateOfferStatus.run("expired", offer.id);
      return { ...offer, status: "expired" };
    }
    return offer;
  }

  function isOfferUnavailable(offer) {
    const workshop = requireWorkshop(offer.workshopSlug);
    return !workshop.registrationOpen || remainingPlaces(workshop) <= 0;
  }

  function materializeOffer(offerId) {
    const offer = requireOffer(offerId);
    const workshop = requireWorkshop(offer.workshopSlug);
    if (offer.status === "accepted") {
      return { view: "offerAccepted", status: createOfferAcceptedStatus(workshop) };
    }
    if (offer.status === "declined") {
      return { view: "offerDeclined", status: createOfferDeclinedStatus(workshop) };
    }
    if (offer.status === "expired") {
      return { view: "offerExpired", status: createOfferExpiredStatus(workshop) };
    }
    if (isOfferUnavailable(offer)) {
      return { view: "offerUnavailable", status: createOfferUnavailableStatus(workshop) };
    }
    return { view: "offerOpen", offer: offerData(offer, workshop) };
  }

  function seedFixtures() {
    const timestamp = nowIso(now);
    statements.insertParticipant.run(defaultParticipantId, "Maya Chen", "maya@example.com");
    statements.insertParticipant.run("confirmed-participant", "Amir Roth", "amir@example.com");
    statements.insertParticipant.run("registered-neighbor", "Nora Stahl", "nora@example.com");
    statements.insertParticipant.run("capacity-holder", "Leo Brandt", "leo@example.com");
    for (const workshop of seededWorkshops) {
      statements.insertWorkshop.run(
        workshop.slug,
        workshop.title,
        workshop.summary,
        workshop.description,
        workshop.date,
        workshop.location,
        workshop.capacity,
        workshop.registrationOpen ? 1 : 0,
        workshop.waitlistOpen ? 1 : 0
      );
    }
    statements.insertRegistration.run(
      "research-ops-foundations",
      defaultParticipantId,
      "Maya Chen",
      "maya@example.com",
      "",
      timestamp
    );
    statements.insertRegistration.run("service-blueprinting", "registered-neighbor", "Nora Stahl", "nora@example.com", "", timestamp);
    statements.insertRegistration.run("journey-mapping-lab", "capacity-holder", "Leo Brandt", "leo@example.com", "", timestamp);
    statements.insertWaitlist.run("service-blueprinting", defaultParticipantId, "Maya Chen", "maya@example.com", "", timestamp);
    statements.insertOffer.run(
      "offer-current",
      "service-blueprinting",
      defaultParticipantId,
      "open",
      "2026-12-15T12:00:00.000Z",
      timestamp
    );
  }

  if (seed) seedFixtures();

  return {
    close() {
      db.close();
    },
    listWorkshops(participantId = defaultParticipantId) {
      ensureParticipant(participantId);
      return db.prepare("SELECT * FROM workshops ORDER BY event_date, title").all().map(rowToWorkshop).map((workshop) => ({
        ...teaserData(workshop),
        availability: availabilityFor(workshop, participantId),
        entry: entryFor(workshop, participantId)
      }));
    },
    materializeWorkshop(slug, participantId = defaultParticipantId) {
      ensureParticipant(participantId);
      const workshop = requireWorkshop(slug);
      const entry = entryFor(workshop, participantId);
      const availability = availabilityFor(workshop, participantId);
      const detail = detailData(workshop, availability);
      if (entry === "alreadyRegistered") {
        return {
          view: entry,
          detail,
          notice: { message: "You already have a confirmed place for this workshop.", tone: "success" }
        };
      }
      if (entry === "alreadyWaitlisted") {
        return {
          view: entry,
          detail,
          notice: { message: "You are already on the waitlist for this workshop.", tone: "info" }
        };
      }
      if (entry === "registrationClosed") {
        return { view: entry, status: createClosedStatus(workshop) };
      }
      return { view: entry, detail };
    },
    validateRegistrationDetails,
    validateWaitlistDetails,
    confirmRegistration(slug, input, participantId = defaultParticipantId) {
      const validation = validateRegistrationDetails(input);
      if (!validation.valid) return { view: "registrationFormError", form: { ...validation.values, errors: validation.errors } };

      return withTransaction(() => {
        ensureParticipant(participantId);
        const workshop = requireWorkshop(slug);
        if (isRegistered(workshop.slug, participantId)) {
          return { view: "registrationAlreadyConfirmed", status: createAlreadyRegisteredStatus(workshop) };
        }
        if (!workshop.registrationOpen) {
          return { view: "registrationClosed", status: createClosedStatus(workshop) };
        }
        if (remainingPlaces(workshop) > 0) {
          statements.insertRegistration.run(
            workshop.slug,
            participantId,
            validation.values.name,
            validation.values.email,
            validation.values.accessibilityNotes,
            nowIso(now)
          );
          statements.deleteWaitlist.run(workshop.slug, participantId);
          return { view: "registrationConfirmed", status: createRegistrationStatus(workshop, validation.values) };
        }
        if (workshop.waitlistOpen) {
          return {
            view: "waitlistPrompt",
            detail: detailData(workshop, "Registration full; waitlist available")
          };
        }
        return { view: "registrationClosed", status: createClosedStatus(workshop) };
      });
    },
    joinWaitlist(slug, input, participantId = defaultParticipantId) {
      const validation = validateWaitlistDetails(input);
      if (!validation.valid) return { view: "waitlistFormError", form: { ...validation.values, errors: validation.errors } };

      return withTransaction(() => {
        ensureParticipant(participantId);
        const workshop = requireWorkshop(slug);
        if (isWaitlisted(workshop.slug, participantId)) {
          return { view: "alreadyWaitlisted", status: createAlreadyWaitlistedStatus(workshop) };
        }
        if (!workshop.registrationOpen || !workshop.waitlistOpen) {
          return { view: "registrationClosed", status: createClosedStatus(workshop) };
        }
        statements.insertWaitlist.run(
          workshop.slug,
          participantId,
          validation.values.name,
          validation.values.email,
          validation.values.notes,
          nowIso(now)
        );
        return { view: "waitlisted", status: createWaitlistedStatus(workshop, validation.values) };
      });
    },
    continueAsWaitlisted(slug, participantId = defaultParticipantId) {
      ensureParticipant(participantId);
      const workshop = requireWorkshop(slug);
      return { view: "waitlisted", status: createAlreadyWaitlistedStatus(workshop) };
    },
    materializeOffer,
    acceptOffer(offerId) {
      return withTransaction(() => {
        const offer = requireOffer(offerId);
        const workshop = requireWorkshop(offer.workshopSlug);
        if (offer.status !== "open") return materializeOffer(offer.id);
        if (isOfferUnavailable(offer)) {
          return { view: "offerUnavailable", status: createOfferUnavailableStatus(workshop) };
        }
        statements.updateOfferStatus.run("accepted", offer.id);
        statements.insertRegistration.run(
          workshop.slug,
          offer.participantId,
          "Maya Chen",
          "maya@example.com",
          "",
          nowIso(now)
        );
        statements.deleteWaitlist.run(workshop.slug, offer.participantId);
        return { view: "offerAccepted", status: createOfferAcceptedStatus(workshop) };
      });
    },
    declineOffer(offerId) {
      return withTransaction(() => {
        const offer = requireOffer(offerId);
        const workshop = requireWorkshop(offer.workshopSlug);
        if (offer.status !== "open") return materializeOffer(offer.id);
        if (isOfferUnavailable(offer)) {
          return { view: "offerUnavailable", status: createOfferUnavailableStatus(workshop) };
        }
        statements.updateOfferStatus.run("declined", offer.id);
        statements.insertWaitlist.run(
          workshop.slug,
          offer.participantId,
          "Maya Chen",
          "maya@example.com",
          "",
          nowIso(now)
        );
        return { view: "offerDeclined", status: createOfferDeclinedStatus(workshop) };
      });
    },
    materializeOfferEmail(offerId, origin = "http://localhost:4174") {
      const offer = requireOffer(offerId);
      const workshop = requireWorkshop(offer.workshopSlug);
      const participant = db.prepare("SELECT * FROM participants WHERE id = ?").get(offer.participantId);
      return {
        to: participant.email,
        subject: `Workshop place available: ${workshop.title}`,
        href: `${origin.replace(/\/$/, "")}/?offer=${encodeURIComponent(offer.id)}`,
        content: offerData(offer, workshop)
      };
    },
    countRegistrations(slug) {
      return registrationCount(slug);
    },
    countWaitlist(slug) {
      return Number(db.prepare("SELECT COUNT(*) AS count FROM waitlist WHERE workshop_slug = ?").get(slug).count);
    },
    setWorkshopState(slug, { capacity, registrationOpen, waitlistOpen }) {
      statements.updateWorkshop.run(
        capacity ?? null,
        registrationOpen === undefined ? null : registrationOpen ? 1 : 0,
        waitlistOpen === undefined ? null : waitlistOpen ? 1 : 0,
        slug
      );
    },
    createOffer({ id, workshopSlug, participantId = defaultParticipantId, status = "open", expiresAt }) {
      ensureParticipant(participantId);
      requireWorkshop(workshopSlug);
      statements.insertOffer.run(id, workshopSlug, participantId, status, expiresAt, nowIso(now));
      return materializeOffer(id);
    }
  };
}

export function createFakeEmailClient({ store, origin = "http://localhost:4174" }) {
  const outbox = [];
  return {
    sendOffer(offerId) {
      const email = store.materializeOfferEmail(offerId, origin);
      outbox.push({ ...email, sentAt: new Date().toISOString() });
      return email;
    },
    outbox() {
      return [...outbox];
    }
  };
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("error", reject);
    request.on("end", () => {
      const text = Buffer.concat(chunks).toString("utf8");
      if (!text) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(text));
      } catch {
        const error = new Error("Request body must be valid JSON.");
        error.status = 400;
        reject(error);
      }
    });
  });
}

function sendJson(response, status, body) {
  response.writeHead(status, jsonHeaders);
  response.end(JSON.stringify(body));
}

function participantFrom(request) {
  const header = request.headers["x-participant-id"];
  return Array.isArray(header) ? header[0] : header || defaultParticipantId;
}

function routeKey(method, pathname) {
  return `${method.toUpperCase()} ${pathname}`;
}

const routeDescriptions = [
  { method: "GET", path: "/api/workshops", summary: "List workshop teasers for the current participant." },
  { method: "GET", path: "/api/workshops/{slug}", summary: "Materialize the participant-specific workshop detail entry." },
  { method: "POST", path: "/api/workshops/{slug}/registrations/confirm", summary: "Confirm registration after review." },
  { method: "POST", path: "/api/workshops/{slug}/waitlist/join", summary: "Join the waitlist after review." },
  { method: "POST", path: "/api/workshops/{slug}/waitlist/continue", summary: "Continue from the already-waitlisted state." },
  { method: "GET", path: "/api/offers/{offerId}", summary: "Materialize an offered place." },
  { method: "POST", path: "/api/offers/{offerId}/accept", summary: "Accept an offered place." },
  { method: "POST", path: "/api/offers/{offerId}/decline", summary: "Decline an offered place." },
  { method: "GET", path: "/api/offers/{offerId}/email", summary: "Materialize the fake email delivery payload." },
  { method: "GET", path: "/openapi.json", summary: "Return transport documentation." },
  { method: "GET", path: "/docs", summary: "Show transport documentation." }
];

export function openApiDocument() {
  const paths = {};
  for (const route of routeDescriptions) {
    paths[route.path] ??= {};
    paths[route.path][route.method.toLowerCase()] = {
      summary: route.summary,
      responses: {
        200: { description: "Successful response." },
        400: { description: "Invalid request." },
        404: { description: "Requested resource was not found." }
      }
    };
  }
  return {
    openapi: "3.1.0",
    info: {
      title: "Workshop registration transport",
      version: "0.0.0"
    },
    paths
  };
}

function docsHtml() {
  const routeItems = routeDescriptions
    .map((route) => `<li><code>${route.method} ${route.path}</code><span>${route.summary}</span></li>`)
    .join("");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Workshop registration transport</title>
    <style>
      body { font-family: Inter, ui-sans-serif, system-ui, sans-serif; margin: 2rem; color: #1e293b; }
      main { max-width: 860px; margin: 0 auto; }
      li { display: grid; grid-template-columns: minmax(18rem, 1fr) 2fr; gap: 1rem; padding: .75rem 0; border-bottom: 1px solid #d8dee9; }
      code { font-weight: 700; }
      a { color: #1d4ed8; }
    </style>
  </head>
  <body>
    <main>
      <h1>Workshop registration transport</h1>
      <p>OpenAPI JSON is available at <a href="/openapi.json">/openapi.json</a>.</p>
      <ul>${routeItems}</ul>
    </main>
  </body>
</html>`;
}

async function handleApi({ request, response, store, emailClient }) {
  const url = new URL(request.url, "http://localhost");
  const method = request.method.toUpperCase();
  const pathname = url.pathname;
  const participantId = participantFrom(request);

  if (method === "OPTIONS") {
    response.writeHead(204, jsonHeaders);
    response.end();
    return true;
  }
  if (routeKey(method, pathname) === "GET /api/workshops") {
    sendJson(response, 200, { workshops: store.listWorkshops(participantId) });
    return true;
  }
  const workshopDetail = pathname.match(/^\/api\/workshops\/([^/]+)$/);
  if (method === "GET" && workshopDetail) {
    sendJson(response, 200, store.materializeWorkshop(decodeURIComponent(workshopDetail[1]), participantId));
    return true;
  }
  const registrationConfirm = pathname.match(/^\/api\/workshops\/([^/]+)\/registrations\/confirm$/);
  if (method === "POST" && registrationConfirm) {
    sendJson(response, 200, store.confirmRegistration(decodeURIComponent(registrationConfirm[1]), await readBody(request), participantId));
    return true;
  }
  const waitlistJoin = pathname.match(/^\/api\/workshops\/([^/]+)\/waitlist\/join$/);
  if (method === "POST" && waitlistJoin) {
    sendJson(response, 200, store.joinWaitlist(decodeURIComponent(waitlistJoin[1]), await readBody(request), participantId));
    return true;
  }
  const waitlistContinue = pathname.match(/^\/api\/workshops\/([^/]+)\/waitlist\/continue$/);
  if (method === "POST" && waitlistContinue) {
    sendJson(response, 200, store.continueAsWaitlisted(decodeURIComponent(waitlistContinue[1]), participantId));
    return true;
  }
  const offerDetail = pathname.match(/^\/api\/offers\/([^/]+)$/);
  if (method === "GET" && offerDetail) {
    sendJson(response, 200, store.materializeOffer(decodeURIComponent(offerDetail[1])));
    return true;
  }
  const offerAccept = pathname.match(/^\/api\/offers\/([^/]+)\/accept$/);
  if (method === "POST" && offerAccept) {
    sendJson(response, 200, store.acceptOffer(decodeURIComponent(offerAccept[1])));
    return true;
  }
  const offerDecline = pathname.match(/^\/api\/offers\/([^/]+)\/decline$/);
  if (method === "POST" && offerDecline) {
    sendJson(response, 200, store.declineOffer(decodeURIComponent(offerDecline[1])));
    return true;
  }
  const offerEmail = pathname.match(/^\/api\/offers\/([^/]+)\/email$/);
  if (method === "GET" && offerEmail) {
    sendJson(response, 200, emailClient.sendOffer(decodeURIComponent(offerEmail[1])));
    return true;
  }
  if (routeKey(method, pathname) === "GET /openapi.json") {
    sendJson(response, 200, openApiDocument());
    return true;
  }
  if (routeKey(method, pathname) === "GET /docs") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(docsHtml());
    return true;
  }
  return false;
}

function serveStatic({ response, pathname, staticRoot }) {
  if (!staticRoot) return false;
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const target = path.resolve(staticRoot, `.${decodeURIComponent(safePath)}`);
  const relative = path.relative(staticRoot, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return false;
  if (!existsSync(target) || !statSync(target).isFile()) {
    const indexPath = path.join(staticRoot, "index.html");
    if (!existsSync(indexPath)) return false;
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    createReadStream(indexPath).pipe(response);
    return true;
  }
  response.writeHead(200, { "content-type": mimeTypes.get(path.extname(target)) ?? "application/octet-stream" });
  createReadStream(target).pipe(response);
  return true;
}

export function createWorkshopServer({ store = createWorkshopStore(), staticRoot } = {}) {
  const emailClient = createFakeEmailClient({ store });
  return createServer(async (request, response) => {
    try {
      const handled = await handleApi({ request, response, store, emailClient });
      if (handled) return;
      const url = new URL(request.url, "http://localhost");
      if (serveStatic({ response, pathname: url.pathname, staticRoot })) return;
      sendJson(response, 404, { error: "Not found." });
    } catch (error) {
      sendJson(response, error.status ?? 500, { error: error.message });
    }
  });
}

export function startServer({ port = 4174, host = "127.0.0.1", databasePath = ":memory:", staticRoot } = {}) {
  const store = createWorkshopStore({ databasePath });
  const server = createWorkshopServer({ store, staticRoot });
  server.listen(port, host, () => {
    const address = server.address();
    const label = typeof address === "object" && address ? `${address.address}:${address.port}` : `${host}:${port}`;
    console.log(`Workshop registration server listening on http://${label}`);
  });
  return { server, store };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const portIndex = process.argv.indexOf("--port");
  const staticIndex = process.argv.indexOf("--static");
  startServer({
    port: portIndex >= 0 ? Number(process.argv[portIndex + 1]) : 4174,
    staticRoot: staticIndex >= 0 ? path.resolve(process.argv[staticIndex + 1]) : undefined
  });
}
