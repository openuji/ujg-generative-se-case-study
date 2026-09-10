/**
 * Who is asking.
 *
 * This is a stand-in sign-in for a service that has no identity provider of its
 * own yet: a participant is chosen from the seeded directory and gets a session
 * token back. There is no credential and nothing is proved — the point of the
 * mechanism is that every later request carries a participant the service
 * resolved itself, rather than one the caller asserted in a payload.
 *
 * That is what makes the product's two subject rules real:
 * "you are already registered" is decided for the participant holding the
 * session, and an offered place can only be answered by the participant it was
 * made to.
 */

import { randomUUID } from "node:crypto";
import { findParticipant, listParticipants } from "../domain/repository.mjs";

const bearerPrefix = "bearer ";

/** The participants a caller may sign in as, for a service seeded with them. */
export function readSignInDirectory(database) {
  return listParticipants(database).map((participant) => ({
    id: participant.id,
    name: participant.name,
    email: participant.email
  }));
}

/**
 * Starts a session for `participantId`. Returns the token and the participant,
 * or `null` when there is no such participant.
 */
export function startSession(database, participantId, now = new Date()) {
  const participant = findParticipant(database, participantId);
  if (participant === null) return null;
  const token = randomUUID();
  database
    .prepare("INSERT INTO participant_sessions (token, participant_id, started_at) VALUES (?, ?, ?)")
    .run(token, participant.id, now.toISOString());
  return { token, participant: { id: participant.id, name: participant.name, email: participant.email } };
}

/** Resolves a session token to the participant holding it, or `null`. */
export function resolveSession(database, token) {
  if (typeof token !== "string" || token.length === 0) return null;
  const session = database
    .prepare("SELECT participant_id FROM participant_sessions WHERE token = ?")
    .get(token);
  if (session === undefined) return null;
  const participant = findParticipant(database, session.participant_id);
  if (participant === null) return null;
  return { id: participant.id, name: participant.name, email: participant.email };
}

/** Ends a session. Returns whether there was one to end. */
export function endSession(database, token) {
  if (typeof token !== "string" || token.length === 0) return false;
  return database.prepare("DELETE FROM participant_sessions WHERE token = ?").run(token).changes > 0;
}

/** Reads a session token out of an incoming request's headers. */
export function sessionTokenFromHeaders(headers) {
  const authorization = headers?.authorization ?? headers?.Authorization;
  if (typeof authorization !== "string") return null;
  if (!authorization.toLowerCase().startsWith(bearerPrefix)) return null;
  const token = authorization.slice(bearerPrefix.length).trim();
  return token.length === 0 ? null : token;
}
