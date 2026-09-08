/**
 * Row-level access to the workshop catalogue. Every read used by an
 * authoritative decision goes through here so it can be issued inside the same
 * transaction as the write that follows it.
 */

export function findWorkshop(database, workshopId) {
  return database.prepare("SELECT * FROM workshops WHERE id = ?").get(workshopId) ?? null;
}

export function listWorkshops(database) {
  return database.prepare("SELECT * FROM workshops ORDER BY scheduled_for, title").all();
}

export function findParticipant(database, participantId) {
  return database.prepare("SELECT * FROM participants WHERE id = ?").get(participantId) ?? null;
}

export function findParticipantByEmail(database, email) {
  return database.prepare("SELECT * FROM participants WHERE email = ?").get(email) ?? null;
}

export function listParticipants(database) {
  return database.prepare("SELECT * FROM participants ORDER BY name").all();
}

export function findParticipation(database, workshopId, participantId) {
  return (
    database
      .prepare("SELECT * FROM workshop_participations WHERE workshop_id = ? AND participant_id = ?")
      .get(workshopId, participantId) ?? null
  );
}

export function listParticipations(database, participantId) {
  return database
    .prepare("SELECT * FROM workshop_participations WHERE participant_id = ? ORDER BY workshop_id")
    .all(participantId);
}

export function recordParticipation(database, participation) {
  database
    .prepare(
      `INSERT INTO workshop_participations
         (workshop_id, participant_id, participation_status, name, email, notes, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (workshop_id, participant_id) DO UPDATE SET
         participation_status = excluded.participation_status,
         name = excluded.name,
         email = excluded.email,
         notes = excluded.notes,
         recorded_at = excluded.recorded_at`
    )
    .run(
      participation.workshopId,
      participation.participantId,
      participation.participationStatus,
      participation.name,
      participation.email,
      participation.notes ?? null,
      participation.recordedAt
    );
}

export function setParticipationStatus(database, workshopId, participantId, participationStatus) {
  return database
    .prepare(
      "UPDATE workshop_participations SET participation_status = ? WHERE workshop_id = ? AND participant_id = ?"
    )
    .run(participationStatus, workshopId, participantId).changes;
}

/**
 * Takes one place off a workshop, but only while the workshop still advertises
 * an available place and still has one left. When the place taken is the last
 * one, the same statement moves the workshop on to its waitlist, so a workshop
 * is never left advertising a place it cannot give.
 *
 * Returns the number of rows changed: 1 when the place was taken, 0 when
 * another command got there first.
 */
export function takeAvailablePlace(database, workshopId) {
  return database
    .prepare(
      `UPDATE workshops
          SET remaining_places = remaining_places - 1,
              registration_availability =
                CASE WHEN remaining_places - 1 = 0 THEN 'waitlistOpen' ELSE registration_availability END
        WHERE id = ?
          AND registration_availability = 'placeAvailable'
          AND remaining_places > 0`
    )
    .run(workshopId).changes;
}

export function findOfferedPlace(database, offeredPlaceId) {
  return database.prepare("SELECT * FROM offered_places WHERE id = ?").get(offeredPlaceId) ?? null;
}

export function listOfferedPlaces(database, participantId) {
  return database
    .prepare("SELECT * FROM offered_places WHERE participant_id = ? ORDER BY expires_at")
    .all(participantId);
}

export function listAllOfferedPlaces(database) {
  return database.prepare("SELECT * FROM offered_places ORDER BY id").all();
}

export function setOfferedPlaceStatus(database, offeredPlaceId, offeredPlaceStatus, expectedStatus) {
  return database
    .prepare("UPDATE offered_places SET offered_place_status = ? WHERE id = ? AND offered_place_status = ?")
    .run(offeredPlaceStatus, offeredPlaceId, expectedStatus).changes;
}

/**
 * Moves every offer whose deadline has passed out of the available state. This
 * is the one change to an offer that no participant asks for; it simply becomes
 * true once the deadline is behind us.
 */
export function expirePassedOffers(database, now) {
  return database
    .prepare(
      "UPDATE offered_places SET offered_place_status = 'expired' WHERE offered_place_status = 'available' AND expires_at <= ?"
    )
    .run(now.toISOString()).changes;
}
