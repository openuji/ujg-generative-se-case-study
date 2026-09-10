/**
 * Which participant this browser is acting as.
 *
 * The token is kept here only so a reload, or a link followed out of a
 * message, does not throw the participant back to the sign-in step. Nothing is
 * decided from it: every request carries it to the service, and the service
 * resolves who is asking.
 */

import type { Session } from "./workshopService";

const storageKey = "workshop-session";

export function rememberSession(session: Session | null) {
  try {
    if (session === null) window.localStorage.removeItem(storageKey);
    else window.localStorage.setItem(storageKey, JSON.stringify(session));
  } catch {
    // A browser that refuses storage simply signs in again next time.
  }
}

export function recallSession(): Session | null {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === null) return null;
    const session = JSON.parse(stored) as Session;
    return typeof session?.token === "string" && typeof session.participant?.id === "string" ? session : null;
  } catch {
    return null;
  }
}
