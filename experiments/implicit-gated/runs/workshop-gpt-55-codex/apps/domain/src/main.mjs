import { DatabaseSync } from "node:sqlite";

export function createWorkshopEngine({ databasePath = ":memory:", now = () => new Date("2025-06-11T12:00:00.000Z") } = {}) {
  const db = new DatabaseSync(databasePath);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS workshops (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      starts_at TEXT NOT NULL,
      location TEXT NOT NULL,
      availability TEXT NOT NULL CHECK (availability IN ('placeAvailable', 'waitlistOpen', 'registrationClosed')),
      capacity INTEGER NOT NULL,
      confirmed_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS participants (
      email TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS participations (
      workshop_slug TEXT NOT NULL REFERENCES workshops(slug),
      participant_email TEXT NOT NULL REFERENCES participants(email),
      status TEXT NOT NULL CHECK (status IN ('confirmed', 'waitlisted')),
      updated_at TEXT NOT NULL,
      PRIMARY KEY (workshop_slug, participant_email)
    );
    CREATE TABLE IF NOT EXISTS offers (
      token TEXT PRIMARY KEY,
      workshop_slug TEXT NOT NULL REFERENCES workshops(slug),
      participant_email TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('available', 'expired', 'unavailable', 'accepted', 'declined')),
      expires_at TEXT NOT NULL
    );
  `);

  function seed() {
    const insertWorkshop = db.prepare(`
      INSERT OR IGNORE INTO workshops (slug, title, summary, starts_at, location, availability, capacity, confirmed_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertWorkshop.run("data-storytelling", "Data Storytelling", "Turn data into clear, compelling stories that drive decisions.", "2025-06-11T14:00:00.000Z", "Virtual", "placeAvailable", 20, 14);
    insertWorkshop.run("team-collaboration", "Effective Team Collaboration", "Build stronger teams with practical communication strategies.", "2025-06-12T10:00:00.000Z", "Room 101", "waitlistOpen", 25, 25);
    insertWorkshop.run("closed-productivity", "Mindful Productivity", "Boost focus and wellbeing with mindful work habits.", "2025-06-13T13:00:00.000Z", "Studio B", "registrationClosed", 30, 30);
    db.prepare("INSERT OR IGNORE INTO participants (email, name) VALUES (?, ?)").run("waitlisted@example.com", "Waitlisted Person");
    db.prepare("INSERT OR IGNORE INTO participations (workshop_slug, participant_email, status, updated_at) VALUES (?, ?, ?, ?)").run("data-storytelling", "waitlisted@example.com", "waitlisted", now().toISOString());
    db.prepare("INSERT OR IGNORE INTO offers (token, workshop_slug, participant_email, status, expires_at) VALUES (?, ?, ?, ?, ?)").run("offer-demo", "data-storytelling", "waitlisted@example.com", "available", "2025-06-14T17:00:00.000Z");
    db.prepare("INSERT OR IGNORE INTO offers (token, workshop_slug, participant_email, status, expires_at) VALUES (?, ?, ?, ?, ?)").run("offer-expired", "data-storytelling", "waitlisted@example.com", "expired", "2025-06-10T17:00:00.000Z");
    db.prepare("INSERT OR IGNORE INTO offers (token, workshop_slug, participant_email, status, expires_at) VALUES (?, ?, ?, ?, ?)").run("offer-unavailable", "data-storytelling", "waitlisted@example.com", "unavailable", "2025-06-14T17:00:00.000Z");
  }

  function registerParticipant(details) {
    const name = String(details.name ?? "").trim();
    const email = String(details.email ?? "").trim().toLowerCase();
    if (!name || !email.includes("@")) {
      return { accepted: false, errors: { details: "Name and email are required." } };
    }
    db.prepare("INSERT INTO participants (email, name) VALUES (?, ?) ON CONFLICT(email) DO UPDATE SET name = excluded.name").run(email, name);
    return { accepted: true, email, name };
  }

  function workshop(slug) {
    return db.prepare("SELECT * FROM workshops WHERE slug = ?").get(slug);
  }

  function participation(slug, email) {
    return db.prepare("SELECT * FROM participations WHERE workshop_slug = ? AND participant_email = ?").get(slug, email.toLowerCase());
  }

  function validateRegistrationDetails(details) {
    const errors = {};
    if (!String(details.name ?? "").trim()) errors.name = "Enter your full name.";
    if (!String(details.email ?? "").includes("@")) errors.email = "Enter a valid email.";
    return { valid: Object.keys(errors).length === 0, errors };
  }

  function validateWaitlistDetails(details) {
    const errors = {};
    if (!String(details.name ?? "").trim()) errors.name = "Enter your full name.";
    if (!String(details.email ?? "").includes("@")) errors.email = "Enter a valid email.";
    return { valid: Object.keys(errors).length === 0, errors };
  }

  function confirmRegistration(slug, details) {
    const valid = validateRegistrationDetails(details);
    if (!valid.valid) return { outcome: "invalid-details", errors: valid.errors };
    db.exec("BEGIN IMMEDIATE");
    try {
      const participant = registerParticipant(details);
      if (!participant.accepted) {
        db.exec("ROLLBACK");
        return { outcome: "invalid-details", errors: participant.errors };
      }
      const selected = workshop(slug);
      if (!selected) {
        db.exec("ROLLBACK");
        return { outcome: "not-found" };
      }
      const existing = participation(slug, participant.email);
      if (existing?.status === "confirmed") {
        db.exec("COMMIT");
        return { outcome: "already-confirmed" };
      }
      if (selected.availability === "registrationClosed") {
        db.exec("COMMIT");
        return { outcome: "closed" };
      }
      if (selected.availability === "waitlistOpen" || selected.confirmed_count >= selected.capacity) {
        db.exec("COMMIT");
        return { outcome: "place-unavailable" };
      }
      db.prepare(`
        INSERT INTO participations (workshop_slug, participant_email, status, updated_at)
        VALUES (?, ?, 'confirmed', ?)
        ON CONFLICT(workshop_slug, participant_email) DO UPDATE SET status = 'confirmed', updated_at = excluded.updated_at
      `).run(slug, participant.email, now().toISOString());
      db.prepare("UPDATE workshops SET confirmed_count = confirmed_count + 1 WHERE slug = ?").run(slug);
      db.exec("COMMIT");
      return { outcome: "confirmed" };
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  function joinWaitlist(slug, details) {
    const valid = validateWaitlistDetails(details);
    if (!valid.valid) return { outcome: "invalid-details", errors: valid.errors };
    db.exec("BEGIN IMMEDIATE");
    try {
      const participant = registerParticipant(details);
      if (!participant.accepted) {
        db.exec("ROLLBACK");
        return { outcome: "invalid-details", errors: participant.errors };
      }
      const selected = workshop(slug);
      if (!selected) {
        db.exec("ROLLBACK");
        return { outcome: "not-found" };
      }
      const existing = participation(slug, participant.email);
      if (existing?.status === "waitlisted") {
        db.exec("COMMIT");
        return { outcome: "already-waitlisted" };
      }
      if (selected.availability === "registrationClosed") {
        db.exec("COMMIT");
        return { outcome: "closed" };
      }
      db.prepare(`
        INSERT INTO participations (workshop_slug, participant_email, status, updated_at)
        VALUES (?, ?, 'waitlisted', ?)
        ON CONFLICT(workshop_slug, participant_email) DO UPDATE SET status = 'waitlisted', updated_at = excluded.updated_at
      `).run(slug, participant.email, now().toISOString());
      db.exec("COMMIT");
      return { outcome: "waitlisted" };
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  function offer(token) {
    return db.prepare("SELECT * FROM offers WHERE token = ?").get(token);
  }

  function resolveOffer(token, participantEmail, response) {
    db.exec("BEGIN IMMEDIATE");
    try {
      const current = offer(token);
      if (!current) {
        db.exec("ROLLBACK");
        return { outcome: "not-found" };
      }
      if (current.participant_email !== participantEmail.toLowerCase()) {
        db.exec("ROLLBACK");
        return { outcome: "not-authorized" };
      }
      if (current.status === "expired") {
        db.exec("COMMIT");
        return { outcome: "expired" };
      }
      if (current.status === "unavailable") {
        db.exec("COMMIT");
        return { outcome: "unavailable" };
      }
      if (current.status === "accepted") {
        db.exec("COMMIT");
        return { outcome: "accepted" };
      }
      if (current.status === "declined") {
        db.exec("COMMIT");
        return { outcome: "declined" };
      }
      const status = response === "accept" ? "accepted" : "declined";
      const participationStatus = response === "accept" ? "confirmed" : "waitlisted";
      db.prepare("UPDATE offers SET status = ? WHERE token = ?").run(status, token);
      db.prepare(`
        INSERT INTO participants (email, name)
        VALUES (?, ?)
        ON CONFLICT(email) DO NOTHING
      `).run(participantEmail.toLowerCase(), participantEmail);
      db.prepare(`
        INSERT INTO participations (workshop_slug, participant_email, status, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(workshop_slug, participant_email) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at
      `).run(current.workshop_slug, participantEmail.toLowerCase(), participationStatus, now().toISOString());
      db.exec("COMMIT");
      return { outcome: status };
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  function renderOfferEmail(token) {
    const current = offer(token);
    if (!current) return { delivered: false };
    const selected = workshop(current.workshop_slug);
    return {
      delivered: true,
      to: current.participant_email,
      subject: "A workshop spot is available",
      body: `A spot is available for ${selected.title}. Open your reserved offer before ${current.expires_at}.`
    };
  }

  function snapshot() {
    return {
      workshops: db.prepare("SELECT * FROM workshops ORDER BY starts_at").all(),
      participations: db.prepare("SELECT * FROM participations ORDER BY workshop_slug, participant_email").all(),
      offers: db.prepare("SELECT * FROM offers ORDER BY token").all()
    };
  }

  seed();

  return {
    db,
    validateRegistrationDetails,
    validateWaitlistDetails,
    confirmRegistration,
    joinWaitlist,
    resolveOffer,
    renderOfferEmail,
    snapshot
  };
}

export function main() {
  const engine = createWorkshopEngine();
  return engine.snapshot();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(main(), null, 2));
}
