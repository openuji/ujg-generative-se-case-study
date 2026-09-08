export interface WorkshopTeaser {
  id: string;
  title: string;
  summary: string;
  date: string;
  location: string;
}

export type WorkshopAvailability = "placeAvailable" | "waitlistOpen" | "registrationClosed";
export type ParticipantStatus = "none" | "confirmed" | "waitlisted";

export interface WorkshopDetail {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  availability: WorkshopAvailability;
  participantStatus: ParticipantStatus;
}

export type RegistrationOutcome =
  | { outcome: "confirmed" | "alreadyRegistered" | "placeUnavailable" | "registrationClosed"; workshop: WorkshopDetail };

export type WaitlistOutcome =
  | { outcome: "waitlisted" | "alreadyWaitlisted" | "registrationClosed"; workshop: WorkshopDetail };

export type OfferStatus = "open" | "expired" | "accepted" | "declined";

export interface Offer {
  id: string;
  workshopId: string;
  status: OfferStatus;
  expiresAt: string;
  workshopTitle: string;
  participantName: string;
}

export type OfferOutcome = { outcome: "confirmed" | "waitlisted" | "expired" | "unavailable" };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init?.headers }
  });
  if (response.status === 404) {
    throw new Error("not_found");
  }
  if (!response.ok) {
    throw new Error(`request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export function listWorkshops(): Promise<WorkshopTeaser[]> {
  return request("/api/workshops");
}

export function getWorkshopDetail(workshopId: string): Promise<WorkshopDetail> {
  return request(`/api/workshops/${workshopId}`);
}

export function submitRegistration(
  workshopId: string,
  body: { name: string; email: string; accessibilityNotes?: string }
): Promise<RegistrationOutcome> {
  return request(`/api/workshops/${workshopId}/registration`, { method: "POST", body: JSON.stringify(body) });
}

export function submitWaitlist(
  workshopId: string,
  body: { name: string; email: string; notes?: string }
): Promise<WaitlistOutcome> {
  return request(`/api/workshops/${workshopId}/waitlist`, { method: "POST", body: JSON.stringify(body) });
}

export function getOffer(offerId: string): Promise<Offer> {
  return request(`/api/offers/${offerId}`);
}

export function acceptOffer(offerId: string): Promise<OfferOutcome> {
  return request(`/api/offers/${offerId}/accept`, { method: "POST" });
}

export function declineOffer(offerId: string): Promise<OfferOutcome> {
  return request(`/api/offers/${offerId}/decline`, { method: "POST" });
}
