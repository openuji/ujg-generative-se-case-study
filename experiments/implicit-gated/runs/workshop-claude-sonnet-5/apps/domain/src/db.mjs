import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, "../.data");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS workshops (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  date TEXT NOT NULL,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  registered_count INTEGER NOT NULL DEFAULT 0,
  waitlist_open INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT
);

CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  workshop_id TEXT NOT NULL REFERENCES workshops(id),
  participant_id TEXT NOT NULL REFERENCES participants(id),
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'waitlisted')),
  accessibility_notes TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (workshop_id, participant_id)
);

CREATE TABLE IF NOT EXISTS offered_places (
  id TEXT PRIMARY KEY,
  workshop_id TEXT NOT NULL REFERENCES workshops(id),
  participant_id TEXT NOT NULL REFERENCES participants(id),
  status TEXT NOT NULL CHECK (status IN ('open', 'accepted', 'declined')) DEFAULT 'open',
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`;

export function openDatabase({ file = ":memory:" } = {}) {
  if (file !== ":memory:") {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }
  const db = new DatabaseSync(file);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  return db;
}

export function defaultDatabaseFile() {
  return path.join(dataDir, "workshop-registration.sqlite");
}

function insertWorkshop(db, workshop) {
  db.prepare(
    `INSERT OR IGNORE INTO workshops (id, title, summary, description, date, location, capacity, registered_count, waitlist_open)
     VALUES (@id, @title, @summary, @description, @date, @location, @capacity, @registeredCount, @waitlistOpen)`
  ).run({
    id: workshop.id,
    title: workshop.title,
    summary: workshop.summary,
    description: workshop.description,
    date: workshop.date,
    location: workshop.location,
    capacity: workshop.capacity,
    registeredCount: workshop.registeredCount,
    waitlistOpen: workshop.waitlistOpen ? 1 : 0
  });
}

function insertParticipant(db, participant) {
  db.prepare(`INSERT OR IGNORE INTO participants (id, name, email) VALUES (?, ?, ?)`).run(
    participant.id,
    participant.name ?? null,
    participant.email ?? null
  );
}

function insertRegistration(db, registration) {
  db.prepare(
    `INSERT OR IGNORE INTO registrations (id, workshop_id, participant_id, status, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    registration.id,
    registration.workshopId,
    registration.participantId,
    registration.status,
    new Date().toISOString()
  );
}

function insertOfferedPlace(db, offer) {
  db.prepare(
    `INSERT OR IGNORE INTO offered_places (id, workshop_id, participant_id, status, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(offer.id, offer.workshopId, offer.participantId, offer.status, offer.expiresAt, new Date().toISOString());
}

/**
 * Seeds representative fixtures so every UJG-modeled direct-entry state
 * (place available, waitlist open, registration closed, and each offered-place
 * outcome) is reachable without hand-authoring data through the API first.
 */
export function seedFixtures(db) {
  const now = Date.now();

  insertWorkshop(db, {
    id: "intro-to-ceramics",
    title: "Intro to Ceramics",
    summary: "Learn wheel-throwing basics in a hands-on afternoon session.",
    description:
      "A hands-on afternoon session covering wheel-throwing basics for beginners. No experience necessary.",
    date: "2026-10-04T10:00:00-07:00",
    location: "Studio B, Riverside Arts Center",
    capacity: 25,
    registeredCount: 18,
    waitlistOpen: true
  });

  insertWorkshop(db, {
    id: "data-storytelling",
    title: "Data Storytelling",
    summary: "Turn data into clear, compelling stories that drive decisions.",
    description:
      "Turn data into clear, compelling stories that drive decisions. You'll learn to identify the key message in your data, choose the right visuals, and present with confidence.",
    date: "2026-10-11T14:00:00-07:00",
    location: "Virtual (video call)",
    capacity: 20,
    registeredCount: 20,
    waitlistOpen: true
  });

  insertWorkshop(db, {
    id: "effective-team-collaboration",
    title: "Effective Team Collaboration",
    summary: "Build stronger teams with practical communication strategies.",
    description:
      "Build stronger teams with practical communication strategies. Registration and the waitlist are both full for this session.",
    date: "2026-10-18T10:00:00-07:00",
    location: "Room 4, Main Campus",
    capacity: 25,
    registeredCount: 25,
    waitlistOpen: false
  });

  const offerParticipant = { id: "fixture-participant-offer-open", name: "Sam Rivera", email: "sam.rivera@example.com" };
  insertParticipant(db, offerParticipant);
  insertRegistration(db, {
    id: randomUUID(),
    workshopId: "data-storytelling",
    participantId: offerParticipant.id,
    status: "waitlisted"
  });
  insertOfferedPlace(db, {
    id: "fixture-offer-open",
    workshopId: "data-storytelling",
    participantId: offerParticipant.id,
    status: "open",
    expiresAt: new Date(now + 1000 * 60 * 60 * 48).toISOString()
  });

  const expiredParticipant = {
    id: "fixture-participant-offer-expired",
    name: "Jordan Blake",
    email: "jordan.blake@example.com"
  };
  insertParticipant(db, expiredParticipant);
  insertRegistration(db, {
    id: randomUUID(),
    workshopId: "data-storytelling",
    participantId: expiredParticipant.id,
    status: "waitlisted"
  });
  insertOfferedPlace(db, {
    id: "fixture-offer-expired",
    workshopId: "data-storytelling",
    participantId: expiredParticipant.id,
    status: "open",
    expiresAt: new Date(now - 1000 * 60 * 60 * 24).toISOString()
  });

  const resolvedParticipant = {
    id: "fixture-participant-offer-resolved",
    name: "Alex Chen",
    email: "alex.chen@example.com"
  };
  insertParticipant(db, resolvedParticipant);
  insertRegistration(db, {
    id: randomUUID(),
    workshopId: "data-storytelling",
    participantId: resolvedParticipant.id,
    status: "confirmed"
  });
  insertOfferedPlace(db, {
    id: "fixture-offer-resolved",
    workshopId: "data-storytelling",
    participantId: resolvedParticipant.id,
    status: "accepted",
    expiresAt: new Date(now + 1000 * 60 * 60 * 48).toISOString()
  });
}
