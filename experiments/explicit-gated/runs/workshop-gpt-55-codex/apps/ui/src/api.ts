export type Tone = "error" | "info" | "success" | "warning";

export interface StatusData {
  title: string;
  message: string;
  tone?: Tone;
  details?: Array<{ term: string; value: string }>;
}

export interface NoticeData {
  message: string;
  tone?: Tone;
}

export interface WorkshopTeaser {
  slug: string;
  title: string;
  summary: string;
  date: string;
  location: string;
  availability: string;
  entry: DetailView;
}

export interface WorkshopDetail {
  title: string;
  description: string;
  date: string;
  location: string;
  availability: string;
}

export interface OfferSummary {
  title: string;
  message: string;
  workshopTitle: string;
  expiresAt: string;
}

export interface RegistrationValues {
  name: string;
  email: string;
  accessibilityNotes: string;
}

export interface WaitlistValues {
  name: string;
  email: string;
  notes: string;
}

export type RegistrationErrors = Partial<Record<keyof RegistrationValues, string>>;
export type WaitlistErrors = Partial<Record<keyof WaitlistValues, string>>;

export type DetailView =
  | "alreadyRegistered"
  | "alreadyWaitlisted"
  | "registrationOpen"
  | "waitlistOpen"
  | "registrationClosed";

export type RegistrationResult =
  | { view: "registrationConfirmed" | "registrationAlreadyConfirmed" | "registrationClosed"; status: StatusData }
  | { view: "registrationFormError"; form: RegistrationValues & { errors: RegistrationErrors } }
  | { view: "waitlistPrompt"; detail: WorkshopDetail };

export type WaitlistResult =
  | { view: "waitlisted" | "alreadyWaitlisted" | "registrationClosed"; status: StatusData }
  | { view: "waitlistFormError"; form: WaitlistValues & { errors: WaitlistErrors } };

export type WorkshopResponse =
  | { view: "alreadyRegistered" | "alreadyWaitlisted"; detail: WorkshopDetail; notice: NoticeData }
  | { view: "registrationOpen" | "waitlistOpen"; detail: WorkshopDetail }
  | { view: "registrationClosed"; status: StatusData };

export type OfferResponse =
  | { view: "offerOpen"; offer: OfferSummary }
  | { view: "offerAccepted" | "offerDeclined" | "offerExpired" | "offerUnavailable"; status: StatusData };

export interface EmailResponse {
  to: string;
  subject: string;
  href: string;
  content: OfferSummary;
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json() as unknown;
  if (!response.ok) {
    const message = typeof body === "object" && body && "error" in body && typeof body.error === "string"
      ? body.error
      : "Request failed.";
    throw new Error(message);
  }
  return body as T;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  return readJson<T>(response);
}

export function listWorkshops() {
  return requestJson<{ workshops: WorkshopTeaser[] }>("/api/workshops");
}

export function loadWorkshop(slug: string) {
  return requestJson<WorkshopResponse>(`/api/workshops/${encodeURIComponent(slug)}`);
}

export function confirmRegistration(slug: string, values: RegistrationValues) {
  return requestJson<RegistrationResult>(`/api/workshops/${encodeURIComponent(slug)}/registrations/confirm`, {
    method: "POST",
    body: JSON.stringify(values)
  });
}

export function joinWaitlist(slug: string, values: WaitlistValues) {
  return requestJson<WaitlistResult>(`/api/workshops/${encodeURIComponent(slug)}/waitlist/join`, {
    method: "POST",
    body: JSON.stringify(values)
  });
}

export function continueAsWaitlisted(slug: string) {
  return requestJson<WaitlistResult>(`/api/workshops/${encodeURIComponent(slug)}/waitlist/continue`, {
    method: "POST",
    body: JSON.stringify({})
  });
}

export function loadOffer(offerId: string) {
  return requestJson<OfferResponse>(`/api/offers/${encodeURIComponent(offerId)}`);
}

export function acceptOffer(offerId: string) {
  return requestJson<OfferResponse>(`/api/offers/${encodeURIComponent(offerId)}/accept`, {
    method: "POST",
    body: JSON.stringify({})
  });
}

export function declineOffer(offerId: string) {
  return requestJson<OfferResponse>(`/api/offers/${encodeURIComponent(offerId)}/decline`, {
    method: "POST",
    body: JSON.stringify({})
  });
}

export function loadOfferEmail(offerId: string) {
  return requestJson<EmailResponse>(`/api/offers/${encodeURIComponent(offerId)}/email`);
}
