export type Availability = "placeAvailable" | "waitlistOpen" | "registrationClosed";
export type Participation = "none" | "confirmed" | "waitlisted";
export type OfferStatus = "available" | "expired" | "unavailable" | "accepted" | "declined";

export type Workshop = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  date: string;
  location: string;
  availability: Availability;
  spotsTaken: number;
  capacity: number;
  participation: Participation;
};

export type PersonDetails = {
  name: string;
  email: string;
  accessibilityNotes?: string;
  notes?: string;
};

export type Offer = {
  token: string;
  participantEmail: string;
  workshopSlug: string;
  status: OfferStatus;
  expiresAt: string;
};

const workshops: Workshop[] = [
  {
    slug: "sustainable-living-basics",
    title: "Sustainable Living Basics",
    summary: "Learn simple, practical steps to live more sustainably every day.",
    description: "A hands-on session with durable habits for lower-waste routines at home and work.",
    date: "Tue, Jun 10, 2025 • 10:00 AM - 12:00 PM",
    location: "Room 204",
    availability: "placeAvailable",
    spotsTaken: 18,
    capacity: 25,
    participation: "none"
  },
  {
    slug: "data-storytelling",
    title: "Data Storytelling",
    summary: "Turn data into clear, compelling stories that drive decisions.",
    description: "In this hands-on session, you will transform complex data into narratives that inform, persuade, and inspire action.",
    date: "Wed, Jun 11, 2025 • 2:00 PM - 4:00 PM",
    location: "Virtual",
    availability: "placeAvailable",
    spotsTaken: 14,
    capacity: 20,
    participation: "none"
  },
  {
    slug: "team-collaboration",
    title: "Effective Team Collaboration",
    summary: "Build stronger teams with practical communication strategies.",
    description: "Practice collaboration rituals that keep cross-functional teams aligned.",
    date: "Thu, Jun 12, 2025 • 10:00 AM - 12:30 PM",
    location: "Room 101",
    availability: "waitlistOpen",
    spotsTaken: 25,
    capacity: 25,
    participation: "none"
  },
  {
    slug: "mindful-productivity",
    title: "Mindful Productivity",
    summary: "Boost focus and wellbeing with mindful work habits.",
    description: "Learn practical methods for focus, planning, and sustainable pace.",
    date: "Fri, Jun 13, 2025 • 1:00 PM - 3:00 PM",
    location: "Studio B",
    availability: "registrationClosed",
    spotsTaken: 30,
    capacity: 30,
    participation: "none"
  }
];

const offers: Offer[] = [
  {
    token: "offer-demo",
    participantEmail: "alex.morgan@example.com",
    workshopSlug: "data-storytelling",
    status: "available",
    expiresAt: "Jun 14, 5:00 PM"
  }
];

export async function listWorkshops() {
  return workshops.map((workshop) => ({ ...workshop }));
}

export async function getWorkshop(slug: string) {
  const workshop = workshops.find((entry) => entry.slug === slug);
  if (!workshop) throw new Error("Workshop not found");
  return { ...workshop };
}

export async function submitRegistrationDetails(details: PersonDetails) {
  const errors: Record<string, string> = {};
  if (!details.name.trim()) errors.name = "Enter your full name.";
  if (!details.email.includes("@")) errors.email = "Enter a valid email.";
  return { valid: Object.keys(errors).length === 0, errors };
}

export async function submitWaitlistDetails(details: PersonDetails) {
  const errors: Record<string, string> = {};
  if (!details.name.trim()) errors.name = "Enter your full name.";
  if (!details.email.includes("@")) errors.email = "Enter a valid email.";
  return { valid: Object.keys(errors).length === 0, errors };
}

export async function confirmRegistration(slug: string, details: PersonDetails) {
  const workshop = workshops.find((entry) => entry.slug === slug);
  if (!workshop) throw new Error("Workshop not found");
  if (workshop.participation === "confirmed") return { outcome: "already-confirmed" as const, workshop: { ...workshop } };
  if (workshop.availability === "waitlistOpen") return { outcome: "place-unavailable" as const, workshop: { ...workshop } };
  if (workshop.availability === "registrationClosed") return { outcome: "closed" as const, workshop: { ...workshop } };
  workshop.participation = "confirmed";
  workshop.spotsTaken += 1;
  return { outcome: "confirmed" as const, workshop: { ...workshop }, details };
}

export async function joinWaitlist(slug: string, details: PersonDetails) {
  const workshop = workshops.find((entry) => entry.slug === slug);
  if (!workshop) throw new Error("Workshop not found");
  if (workshop.participation === "waitlisted") return { outcome: "already-waitlisted" as const, workshop: { ...workshop } };
  if (workshop.availability === "registrationClosed") return { outcome: "closed" as const, workshop: { ...workshop } };
  workshop.participation = "waitlisted";
  return { outcome: "waitlisted" as const, workshop: { ...workshop }, details };
}

export async function getOffer(token: string) {
  const offer = offers.find((entry) => entry.token === token);
  if (!offer) throw new Error("Offer not found");
  const workshop = await getWorkshop(offer.workshopSlug);
  return { offer: { ...offer }, workshop };
}

export async function acceptOffer(token: string, email: string) {
  const offer = offers.find((entry) => entry.token === token);
  if (!offer) throw new Error("Offer not found");
  const workshop = workshops.find((entry) => entry.slug === offer.workshopSlug);
  if (!workshop) throw new Error("Workshop not found");
  if (offer.participantEmail !== email) return { outcome: "not-authorized" as const, workshop: { ...workshop } };
  if (offer.status === "expired") return { outcome: "expired" as const, workshop: { ...workshop } };
  if (offer.status === "unavailable") return { outcome: "unavailable" as const, workshop: { ...workshop } };
  if (offer.status === "accepted") return { outcome: "accepted" as const, workshop: { ...workshop } };
  if (offer.status === "declined") return { outcome: "declined" as const, workshop: { ...workshop } };
  offer.status = "accepted";
  workshop.participation = "confirmed";
  return { outcome: "accepted" as const, workshop: { ...workshop } };
}

export async function declineOffer(token: string, email: string) {
  const offer = offers.find((entry) => entry.token === token);
  if (!offer) throw new Error("Offer not found");
  const workshop = workshops.find((entry) => entry.slug === offer.workshopSlug);
  if (!workshop) throw new Error("Workshop not found");
  if (offer.participantEmail !== email) return { outcome: "not-authorized" as const, workshop: { ...workshop } };
  if (offer.status === "expired") return { outcome: "expired" as const, workshop: { ...workshop } };
  if (offer.status === "unavailable") return { outcome: "unavailable" as const, workshop: { ...workshop } };
  if (offer.status === "accepted") return { outcome: "accepted" as const, workshop: { ...workshop } };
  if (offer.status === "declined") return { outcome: "declined" as const, workshop: { ...workshop } };
  offer.status = "declined";
  workshop.participation = "waitlisted";
  return { outcome: "declined" as const, workshop: { ...workshop } };
}
