import type {
  AcceptOfferOutcomeResponse,
  DeclineOfferOutcomeResponse,
  OfferResponse,
  RegistrationDetailsInput,
  RegistrationOutcomeResponse,
  WaitlistDetailsInput,
  WaitlistOutcomeResponse,
  WorkshopCollectionResponse,
  WorkshopDetailResponse
} from "./contracts";
// localStorage.setItem("referenceAuthToken", "token-blair")
const token = () => localStorage.getItem("referenceAuthToken") ?? "token-alex";

async function request<T>(path: string, { method = "GET", body, authenticated = false }: {
  method?: "GET" | "POST";
  body?: unknown;
  authenticated?: boolean;
} = {}): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: {
      ...(authenticated ? { authorization: `Bearer ${token()}` } : {}),
      ...(body ? { "content-type": "application/json" } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? `Request failed with status ${response.status}`);
  return payload as T;
}

export const api = {
  listWorkshops: () => request<WorkshopCollectionResponse>("/api/workshops"),
  getWorkshop: (workshopId: string) =>
    request<WorkshopDetailResponse>(`/api/workshops/${encodeURIComponent(workshopId)}`, { authenticated: true }),
  confirmRegistration: (workshopId: string, body: RegistrationDetailsInput) =>
    request<RegistrationOutcomeResponse>(`/api/workshops/${encodeURIComponent(workshopId)}/registrations`, {
      method: "POST",
      body,
      authenticated: true
    }),
  joinWaitlist: (workshopId: string, body: WaitlistDetailsInput) =>
    request<WaitlistOutcomeResponse>(`/api/workshops/${encodeURIComponent(workshopId)}/waitlist`, {
      method: "POST",
      body,
      authenticated: true
    }),
  getOffer: (offerId: string) =>
    request<OfferResponse>(`/api/offers/${encodeURIComponent(offerId)}`, { authenticated: true }),
  acceptOffer: (offerId: string) =>
    request<AcceptOfferOutcomeResponse>(`/api/offers/${encodeURIComponent(offerId)}/accept`, {
      method: "POST",
      authenticated: true
    }),
  declineOffer: (offerId: string) =>
    request<DeclineOfferOutcomeResponse>(`/api/offers/${encodeURIComponent(offerId)}/decline`, {
      method: "POST",
      authenticated: true
    })
};
