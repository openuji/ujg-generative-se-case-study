import type { StatusMessageDetail, Tone } from "../components/StatusMessage/StatusMessage";

export const teaserData = {
  title: "Practical AI Facilitation",
  summary: "A working session for planning and facilitating responsible AI workshops.",
  date: "October 14, 2026",
  location: "Berlin Studio"
};

export const detailData = {
  title: "Practical AI Facilitation",
  description: "A half-day workshop for teams that need repeatable facilitation patterns.",
  date: "October 14, 2026",
  location: "Berlin Studio",
  availability: "Places available"
};

export const registrationFormData = {
  name: "Ari Santos",
  email: "ari@example.com",
  accessibilityNotes: "Captioning preferred",
  errors: {
    email: "Use a reachable email address."
  }
};

export const waitlistFormData = {
  name: "Morgan Lee",
  email: "morgan@example.com",
  notes: "Can attend on short notice",
  errors: {
    notes: "Keep notes under 200 characters."
  }
};

export const registrationReviewData = {
  workshopTitle: detailData.title,
  name: registrationFormData.name,
  email: registrationFormData.email
};

export const waitlistReviewData = {
  workshopTitle: detailData.title,
  name: waitlistFormData.name,
  email: waitlistFormData.email
};

export const statusDetails: StatusMessageDetail[] = [
  { term: "Workshop", value: detailData.title },
  { term: "Date", value: detailData.date }
];

export const statusData = {
  title: "Registration confirmed",
  message: "Your place is confirmed.",
  tone: "success" as Tone,
  details: statusDetails
};

export const noticeData = {
  message: "You are already registered for this workshop.",
  tone: "info" as Tone
};

export const offerData = {
  title: "A place is available",
  message: "A seat opened for the workshop you joined the waitlist for.",
  workshopTitle: detailData.title,
  expiresAt: "September 15, 2026 17:00"
};
