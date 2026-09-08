import { randomUUID } from "node:crypto";

export function availabilityOf(workshop) {
  if (workshop.registered_count < workshop.capacity) return "placeAvailable";
  if (workshop.waitlist_open) return "waitlistOpen";
  return "registrationClosed";
}

function toWorkshopTeaser(row) {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    date: row.date,
    location: row.location
  };
}

function getWorkshopRow(db, workshopId) {
  return db.prepare("SELECT * FROM workshops WHERE id = ?").get(workshopId);
}

function getRegistrationRow(db, workshopId, participantId) {
  return db
    .prepare("SELECT * FROM registrations WHERE workshop_id = ? AND participant_id = ?")
    .get(workshopId, participantId);
}

export function listWorkshops(db) {
  return db.prepare("SELECT * FROM workshops ORDER BY date ASC").all().map(toWorkshopTeaser);
}

export function getWorkshopDetail(db, workshopId, participantId) {
  const workshop = getWorkshopRow(db, workshopId);
  if (!workshop) return null;
  const registration = getRegistrationRow(db, workshopId, participantId);
  return {
    id: workshop.id,
    title: workshop.title,
    description: workshop.description,
    date: workshop.date,
    location: workshop.location,
    availability: availabilityOf(workshop),
    participantStatus: registration?.status ?? "none"
  };
}

function upsertParticipant(db, participantId, { name, email }) {
  db.prepare(
    `INSERT INTO participants (id, name, email) VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, email = excluded.email`
  ).run(participantId, name ?? null, email ?? null);
}

/**
 * Runs `work` inside a SQLite transaction. node:sqlite's DatabaseSync API is
 * fully synchronous and Node is single-threaded, so no other request can
 * observe or mutate the database between the read and the write below --
 * the BEGIN IMMEDIATE additionally protects against a second os-level
 * connection to the same file (e.g. a concurrently running test process).
 */
function atomically(db, work) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function confirmRegistration(db, workshopId, participantId, details) {
  return atomically(db, () => {
    const workshop = getWorkshopRow(db, workshopId);
    if (!workshop) return { outcome: "notFound" };

    const existing = getRegistrationRow(db, workshopId, participantId);
    if (existing?.status === "confirmed") {
      return { outcome: "alreadyRegistered", workshop: toDetail(workshop, existing) };
    }

    const availability = availabilityOf(workshop);
    if (availability === "registrationClosed") {
      return { outcome: "registrationClosed", workshop: toDetail(workshop, existing) };
    }
    if (availability !== "placeAvailable") {
      return { outcome: "placeUnavailable", workshop: toDetail(workshop, existing) };
    }

    upsertParticipant(db, participantId, details);
    if (existing) {
      db.prepare(
        "UPDATE registrations SET status = 'confirmed', accessibility_notes = ? WHERE id = ?"
      ).run(details.accessibilityNotes ?? null, existing.id);
    } else {
      db.prepare(
        `INSERT INTO registrations (id, workshop_id, participant_id, status, accessibility_notes, created_at)
         VALUES (?, ?, ?, 'confirmed', ?, ?)`
      ).run(randomUUID(), workshopId, participantId, details.accessibilityNotes ?? null, new Date().toISOString());
    }
    db.prepare("UPDATE workshops SET registered_count = registered_count + 1 WHERE id = ?").run(workshopId);

    const updated = getWorkshopRow(db, workshopId);
    return { outcome: "confirmed", workshop: toDetail(updated, getRegistrationRow(db, workshopId, participantId)) };
  });
}

export function joinWaitlist(db, workshopId, participantId, details) {
  return atomically(db, () => {
    const workshop = getWorkshopRow(db, workshopId);
    if (!workshop) return { outcome: "notFound" };

    const existing = getRegistrationRow(db, workshopId, participantId);
    if (existing?.status === "waitlisted") {
      return { outcome: "alreadyWaitlisted", workshop: toDetail(workshop, existing) };
    }

    const availability = availabilityOf(workshop);
    if (availability === "registrationClosed" || !workshop.waitlist_open) {
      return { outcome: "registrationClosed", workshop: toDetail(workshop, existing) };
    }

    upsertParticipant(db, participantId, details);
    if (existing) {
      db.prepare("UPDATE registrations SET status = 'waitlisted', notes = ? WHERE id = ?").run(
        details.notes ?? null,
        existing.id
      );
    } else {
      db.prepare(
        `INSERT INTO registrations (id, workshop_id, participant_id, status, notes, created_at)
         VALUES (?, ?, ?, 'waitlisted', ?, ?)`
      ).run(randomUUID(), workshopId, participantId, details.notes ?? null, new Date().toISOString());
    }

    return { outcome: "waitlisted", workshop: toDetail(workshop, getRegistrationRow(db, workshopId, participantId)) };
  });
}

function toDetail(workshop, registration) {
  return {
    id: workshop.id,
    title: workshop.title,
    description: workshop.description,
    date: workshop.date,
    location: workshop.location,
    availability: availabilityOf(workshop),
    participantStatus: registration?.status ?? "none"
  };
}

function getOfferRow(db, offerId) {
  return db.prepare("SELECT * FROM offered_places WHERE id = ?").get(offerId);
}

function effectiveOfferStatus(offer) {
  if (offer.status === "accepted") return "accepted";
  if (offer.status === "declined") return "declined";
  if (new Date(offer.expires_at).getTime() < Date.now()) return "expired";
  return "open";
}

export function getOffer(db, offerId) {
  const offer = getOfferRow(db, offerId);
  if (!offer) return null;
  const workshop = getWorkshopRow(db, offer.workshop_id);
  const participant = db.prepare("SELECT * FROM participants WHERE id = ?").get(offer.participant_id);
  return {
    id: offer.id,
    workshopId: offer.workshop_id,
    participantId: offer.participant_id,
    status: effectiveOfferStatus(offer),
    expiresAt: offer.expires_at,
    workshopTitle: workshop?.title ?? "",
    participantName: participant?.name ?? ""
  };
}

/**
 * The offered-place invariant restricts acceptance/decline to the intended
 * participant. Because the app's identity is a fake, link-carried token
 * (see http.mjs), presenting a different participant id here is treated the
 * same as any other invalid-state case rather than a distinct authorization
 * error: "unavailable" covers both "not yours" and "already resolved".
 */
export function acceptOffer(db, offerId, participantId) {
  return atomically(db, () => {
    const offer = getOfferRow(db, offerId);
    if (!offer) return { outcome: "notFound" };
    if (offer.participant_id !== participantId) return { outcome: "unavailable" };

    const status = effectiveOfferStatus(offer);
    if (status === "expired") return { outcome: "expired" };
    if (status !== "open") return { outcome: "unavailable" };

    db.prepare("UPDATE offered_places SET status = 'accepted' WHERE id = ?").run(offerId);
    const registration = getRegistrationRow(db, offer.workshop_id, offer.participant_id);
    if (registration?.status !== "confirmed") {
      db.prepare("UPDATE registrations SET status = 'confirmed' WHERE id = ?").run(registration.id);
      db.prepare("UPDATE workshops SET registered_count = registered_count + 1 WHERE id = ?").run(offer.workshop_id);
    }

    return { outcome: "confirmed", offer: getOffer(db, offerId) };
  });
}

export function declineOffer(db, offerId, participantId) {
  return atomically(db, () => {
    const offer = getOfferRow(db, offerId);
    if (!offer) return { outcome: "notFound" };
    if (offer.participant_id !== participantId) return { outcome: "unavailable" };

    const status = effectiveOfferStatus(offer);
    if (status === "expired") return { outcome: "expired" };
    if (status !== "open") return { outcome: "unavailable" };

    db.prepare("UPDATE offered_places SET status = 'declined' WHERE id = ?").run(offerId);
    return { outcome: "waitlisted", offer: getOffer(db, offerId) };
  });
}
