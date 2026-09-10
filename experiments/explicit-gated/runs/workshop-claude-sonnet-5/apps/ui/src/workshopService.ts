/**
 * Talking to the workshop service.
 *
 * Nothing here decides anything. Every question about whether a place can be
 * booked, whether a waitlist is open, or who may answer an offer is asked of
 * the service and its answer is passed straight through; this module only
 * knows the addresses and the shapes that come back from them.
 */

const serviceBase = "/api";

export interface Participant {
  id: string;
  name: string;
  email: string;
}

export interface Session {
  token: string;
  participant: Participant;
}

export type StatusTone = "error" | "info" | "success" | "warning";

export interface StatusDetail {
  term: string;
  value: string;
}

export interface StatusMessageDocument {
  title: string;
  message: string;
  tone?: StatusTone;
  details?: StatusDetail[];
}

export interface StatusNoticeDocument {
  message: string;
  tone?: StatusTone;
}

export interface WorkshopTeaserDocument {
  title: string;
  summary: string;
  date: string;
  location: string;
}

export interface WorkshopDetailDocument {
  title: string;
  description: string;
  date: string;
  location: string;
  availability: string;
}

export interface RegistrationFormDocument {
  name?: string;
  email?: string;
  accessibilityNotes?: string;
  errors?: {
    name?: string;
    email?: string;
    accessibilityNotes?: string;
  };
}

export interface WaitlistFormDocument {
  name?: string;
  email?: string;
  notes?: string;
  errors?: {
    name?: string;
    email?: string;
    notes?: string;
  };
}

export interface ReviewDocument {
  workshopTitle: string;
  name: string;
  email: string;
}

export interface OfferSummaryDocument {
  title: string;
  message: string;
  workshopTitle: string;
  expiresAt: string;
}

export type WorkshopView =
  | "registrationOpen"
  | "waitlistOpen"
  | "registrationClosed"
  | "alreadyRegistered"
  | "alreadyWaitlisted";

export interface WorkshopEntry {
  id: string;
  teaser: WorkshopTeaserDocument;
}

export interface WorkshopSituation {
  id: string;
  view: WorkshopView;
  detail: WorkshopDetailDocument;
  notice?: StatusNoticeDocument;
  status?: StatusMessageDocument;
}

export type RegistrationReviewAnswer =
  | { outcome: "ready"; review: ReviewDocument }
  | { outcome: "invalidDetails"; form: RegistrationFormDocument };

export type WaitlistReviewAnswer =
  | { outcome: "ready"; review: ReviewDocument }
  | { outcome: "invalidDetails"; form: WaitlistFormDocument };

export type RegistrationAnswer =
  | { outcome: "confirmed" | "alreadyConfirmed" | "registrationClosed"; effectApplied: boolean; status: StatusMessageDocument }
  | { outcome: "placeUnavailable"; effectApplied: boolean; id: string; detail: WorkshopDetailDocument }
  | { outcome: "invalidDetails"; form: RegistrationFormDocument };

export type WaitlistAnswer =
  | { outcome: "waitlisted" | "alreadyWaitlisted" | "registrationClosed"; effectApplied: boolean; status: StatusMessageDocument }
  | { outcome: "unsupported"; effectApplied: boolean }
  | { outcome: "invalidDetails"; form: WaitlistFormDocument };

export interface WaitlistStanding {
  outcome: "waitlisted";
  id: string;
  status: StatusMessageDocument;
}

export type OfferView = "available" | "expired" | "unavailable" | "accepted" | "declined";

export interface OfferEntry {
  id: string;
  workshopTitle: string;
  view: OfferView;
}

export interface OfferSituation {
  id: string;
  view: OfferView;
  offer?: OfferSummaryDocument;
  status?: StatusMessageDocument;
}

export interface OfferAnswer {
  outcome: "accepted" | "declined" | "alreadyAccepted" | "alreadyDeclined" | "expired" | "unavailable";
  effectApplied: boolean;
  status: StatusMessageDocument;
}

export interface DeliveredMessage {
  to: string;
  subject: string;
  html: string;
  deliveredAt: string;
}

export interface Refusal {
  error: string;
  problems?: { pointer: string; message: string }[];
}

/** An answer that arrived, whatever it said. */
export interface Answer<TBody> {
  status: number;
  ok: boolean;
  body: TBody;
}

/** Raised when the service could not be reached at all. */
export class ServiceUnreachable extends Error {}

async function ask<TBody>(
  method: string,
  route: string,
  options: { token?: string | null; body?: unknown } = {}
): Promise<Answer<TBody>> {
  const headers: Record<string, string> = {};
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  if (options.body !== undefined) headers["content-type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${serviceBase}${route}`, {
      method,
      headers,
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) })
    });
  } catch (cause) {
    throw new ServiceUnreachable(`The workshop service could not be reached: ${String(cause)}`);
  }

  const text = await response.text();
  return {
    status: response.status,
    ok: response.ok,
    body: (text.length === 0 ? undefined : JSON.parse(text)) as TBody
  };
}

export function readSignInDirectory() {
  return ask<{ participants: Participant[] }>("GET", "/participants");
}

export function signIn(participantId: string) {
  return ask<Session | Refusal>("POST", "/sessions", { body: { participantId } });
}

export function signOut(token: string) {
  return ask<undefined>("DELETE", "/sessions/current", { token });
}

export function readCurrentSession(token: string) {
  return ask<{ participant: Participant } | Refusal>("GET", "/sessions/current", { token });
}

export function readWorkshops() {
  return ask<{ workshops: WorkshopEntry[] }>("GET", "/workshops");
}

export function readWorkshop(workshopId: string, token: string | null) {
  return ask<WorkshopSituation | Refusal>("GET", `/workshops/${encodeURIComponent(workshopId)}`, { token });
}

export function reviewRegistration(workshopId: string, submitted: RegistrationFormDocument, token: string) {
  return ask<RegistrationReviewAnswer | Refusal>(
    "POST",
    `/workshops/${encodeURIComponent(workshopId)}/registration/review`,
    { token, body: submitted }
  );
}

export function confirmRegistration(workshopId: string, submitted: RegistrationFormDocument, token: string) {
  return ask<RegistrationAnswer | Refusal>("POST", `/workshops/${encodeURIComponent(workshopId)}/registration`, {
    token,
    body: submitted
  });
}

export function reviewWaitlist(workshopId: string, submitted: WaitlistFormDocument, token: string) {
  return ask<WaitlistReviewAnswer | Refusal>(
    "POST",
    `/workshops/${encodeURIComponent(workshopId)}/waitlist/review`,
    { token, body: submitted }
  );
}

export function joinWaitlist(workshopId: string, submitted: WaitlistFormDocument, token: string) {
  return ask<WaitlistAnswer | Refusal>("POST", `/workshops/${encodeURIComponent(workshopId)}/waitlist`, {
    token,
    body: submitted
  });
}

export function readWaitlistStanding(workshopId: string, token: string) {
  return ask<WaitlistStanding | Refusal>("GET", `/workshops/${encodeURIComponent(workshopId)}/waitlist`, { token });
}

export function readOffers(token: string) {
  return ask<{ offers: OfferEntry[] }>("GET", "/offers", { token });
}

export function readOffer(offeredPlaceId: string, token: string) {
  return ask<OfferSituation | Refusal>("GET", `/offers/${encodeURIComponent(offeredPlaceId)}`, { token });
}

export function acceptOffer(offeredPlaceId: string, token: string) {
  return ask<OfferAnswer | Refusal>("POST", `/offers/${encodeURIComponent(offeredPlaceId)}/accept`, { token });
}

export function declineOffer(offeredPlaceId: string, token: string) {
  return ask<OfferAnswer | Refusal>("POST", `/offers/${encodeURIComponent(offeredPlaceId)}/decline`, { token });
}

export function readOfferMessage(offeredPlaceId: string, token: string) {
  return ask<DeliveredMessage | Refusal>("GET", `/offers/${encodeURIComponent(offeredPlaceId)}/message`, { token });
}

export function refusalText(body: unknown, fallback: string) {
  const refusal = body as Refusal | undefined;
  return typeof refusal?.error === "string" ? refusal.error : fallback;
}
