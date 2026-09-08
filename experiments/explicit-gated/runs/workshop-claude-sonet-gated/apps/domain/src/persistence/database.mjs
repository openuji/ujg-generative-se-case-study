/**
 * SQLite persistence for the workshop service.
 *
 * Every authoritative decision the service makes is taken inside a write
 * transaction opened here, so the facts a decision depends on cannot change
 * between being read and the resulting change being written.
 */

import { DatabaseSync } from "node:sqlite";

export const registrationAvailabilities = Object.freeze([
  "placeAvailable",
  "waitlistOpen",
  "registrationClosed"
]);

export const participationStatuses = Object.freeze(["waitlisted", "confirmed"]);

export const offeredPlaceStatuses = Object.freeze([
  "available",
  "expired",
  "unavailable",
  "accepted",
  "declined"
]);

const schema = `
CREATE TABLE IF NOT EXISTS participants (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS workshops (
  id                        TEXT PRIMARY KEY,
  title                     TEXT NOT NULL,
  summary                   TEXT NOT NULL,
  description               TEXT NOT NULL,
  scheduled_for             TEXT NOT NULL,
  location                  TEXT NOT NULL,
  registration_availability TEXT NOT NULL,
  remaining_places          INTEGER NOT NULL,
  CHECK (registration_availability IN ('placeAvailable', 'waitlistOpen', 'registrationClosed')),
  CHECK (remaining_places >= 0),
  -- A workshop may only advertise an open place while it still has one.
  CHECK (registration_availability <> 'placeAvailable' OR remaining_places > 0)
);

CREATE TABLE IF NOT EXISTS workshop_participations (
  workshop_id          TEXT NOT NULL REFERENCES workshops(id),
  participant_id       TEXT NOT NULL REFERENCES participants(id),
  participation_status TEXT NOT NULL,
  name                 TEXT NOT NULL,
  email                TEXT NOT NULL,
  notes                TEXT,
  recorded_at          TEXT NOT NULL,
  PRIMARY KEY (workshop_id, participant_id),
  CHECK (participation_status IN ('waitlisted', 'confirmed'))
);

CREATE TABLE IF NOT EXISTS offered_places (
  id                   TEXT PRIMARY KEY,
  workshop_id          TEXT NOT NULL REFERENCES workshops(id),
  participant_id       TEXT NOT NULL REFERENCES participants(id),
  offered_place_status TEXT NOT NULL,
  expires_at           TEXT NOT NULL,
  CHECK (offered_place_status IN ('available', 'expired', 'unavailable', 'accepted', 'declined'))
);

CREATE TABLE IF NOT EXISTS participant_sessions (
  token          TEXT PRIMARY KEY,
  participant_id TEXT NOT NULL REFERENCES participants(id),
  started_at     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS offered_places_by_participant
  ON offered_places (participant_id);
`;

export function openDatabase(location = ":memory:") {
  const database = new DatabaseSync(location);
  database.exec("PRAGMA foreign_keys = ON");
  database.exec("PRAGMA busy_timeout = 5000");
  if (location !== ":memory:") database.exec("PRAGMA journal_mode = WAL");
  database.exec(schema);
  return database;
}

/**
 * Runs `work` inside an immediate write transaction. The transaction takes the
 * write lock up front, so a competing command cannot slip between the facts
 * this one checks and the change it writes.
 */
export function inWriteTransaction(database, work) {
  database.exec("BEGIN IMMEDIATE");
  try {
    const result = work();
    database.exec("COMMIT");
    return result;
  } catch (error) {
    try {
      database.exec("ROLLBACK");
    } catch {
      // A failed rollback means the transaction was already unwound.
    }
    throw error;
  }
}

export function closeDatabase(database) {
  database.close();
}
