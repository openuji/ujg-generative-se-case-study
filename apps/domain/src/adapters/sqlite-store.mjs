import { DatabaseSync } from "node:sqlite";

const schema = `
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS workshops (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    location TEXT NOT NULL,
    availability TEXT NOT NULL CHECK (availability IN ('placeAvailable', 'waitlistOpen', 'registrationClosed'))
  ) STRICT;
  CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    auth_token TEXT NOT NULL UNIQUE
  ) STRICT;
  CREATE TABLE IF NOT EXISTS participations (
    participant_id TEXT NOT NULL REFERENCES participants(id),
    workshop_id TEXT NOT NULL REFERENCES workshops(id),
    status TEXT NOT NULL CHECK (status IN ('waitlisted', 'confirmed')),
    submitted_name TEXT NOT NULL,
    submitted_email TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL,
    PRIMARY KEY (participant_id, workshop_id)
  ) STRICT;
  CREATE TABLE IF NOT EXISTS offers (
    id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL REFERENCES participants(id),
    workshop_id TEXT NOT NULL REFERENCES workshops(id),
    status TEXT NOT NULL CHECK (status IN ('available', 'expired', 'unavailable', 'accepted', 'declined')),
    expires_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  ) STRICT;
`;

export class SqliteStore {
  constructor(filename) {
    this.database = new DatabaseSync(filename);
    this.database.exec(schema);
  }

  close() {
    this.database.close();
  }

  transaction(work) {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const result = work();
      this.database.exec("COMMIT");
      return result;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  listWorkshops() {
    return this.database.prepare("SELECT * FROM workshops ORDER BY date, id").all();
  }

  getWorkshop(id) {
    return this.database.prepare("SELECT * FROM workshops WHERE id = ?").get(id);
  }

  getParticipantByToken(token) {
    return this.database.prepare("SELECT id, name, email FROM participants WHERE auth_token = ?").get(token);
  }

  getParticipation(participantId, workshopId) {
    return this.database.prepare(
      "SELECT * FROM participations WHERE participant_id = ? AND workshop_id = ?"
    ).get(participantId, workshopId);
  }

  saveParticipation({ participantId, workshopId, status, name, email, notes = "", now }) {
    this.database.prepare(`
      INSERT INTO participations (
        participant_id, workshop_id, status, submitted_name, submitted_email, notes, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(participant_id, workshop_id) DO UPDATE SET
        status = excluded.status,
        submitted_name = excluded.submitted_name,
        submitted_email = excluded.submitted_email,
        notes = excluded.notes,
        updated_at = excluded.updated_at
    `).run(participantId, workshopId, status, name, email, notes, now);
  }

  getOffer(id) {
    return this.database.prepare("SELECT * FROM offers WHERE id = ?").get(id);
  }

  setOfferStatus(id, status, now) {
    this.database.prepare("UPDATE offers SET status = ?, updated_at = ? WHERE id = ?").run(status, now, id);
  }
}
