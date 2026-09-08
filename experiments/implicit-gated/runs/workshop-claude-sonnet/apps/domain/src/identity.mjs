import { randomUUID } from "node:crypto";

const COOKIE_NAME = "participantId";

/**
 * Stands in for real authentication: whoever holds the participantId cookie
 * is treated as that participant. There is no modeled sign-in journey, so a
 * fresh visitor is issued a new anonymous participant id on first contact.
 */
export function readParticipantId(request) {
  const header = request.headers.cookie ?? "";
  const match = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.slice(COOKIE_NAME.length + 1)) : undefined;
}

export function issueParticipantId() {
  return randomUUID();
}

export function participantCookie(participantId) {
  return `${COOKIE_NAME}=${encodeURIComponent(participantId)}; Path=/; SameSite=Lax; Max-Age=31536000`;
}
