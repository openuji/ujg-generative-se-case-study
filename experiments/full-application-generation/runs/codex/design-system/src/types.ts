import type { FormEventHandler, ReactNode } from "react";

export type Tone = "error" | "info" | "success" | "warning";

export type WorkshopTeaserData = {
  title: string;
  summary: string;
  date: string;
  location: string;
};

export type WorkshopDetailData = {
  title: string;
  description: string;
  date: string;
  location: string;
  availability: string;
};

export type RegistrationFormData = {
  name?: string;
  email?: string;
  accessibilityNotes?: string;
  errors?: Partial<Record<"name" | "email" | "accessibilityNotes", string>>;
};

export type WaitlistFormData = {
  name?: string;
  email?: string;
  notes?: string;
  errors?: Partial<Record<"name" | "email" | "notes", string>>;
};

export type RegistrationReviewData = {
  workshopTitle: string;
  name: string;
  email: string;
};

export type WaitlistReviewData = {
  workshopTitle: string;
  name: string;
  email: string;
};

export type StatusDetail = {
  term: string;
  value: string;
};

export type StatusMessageData = {
  title: string;
  message: string;
  tone?: Tone;
  details?: StatusDetail[];
};

export type StatusNoticeData = {
  message: string;
  tone?: Tone;
};

export type OfferSummaryData = {
  title: string;
  message: string;
  workshopTitle: string;
  expiresAt: string;
};

export type ActionControlProps = {
  label: string;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  onAction?: () => void;
};

export type EmailLinkControlProps = {
  label: string;
  href: string;
  onFollow?: () => void;
};

export type SlotProps = {
  children?: ReactNode;
};

export type FormTemplateProps = {
  formFields: ReactNode;
  formSubmitAction: ReactNode;
  onSubmit?: FormEventHandler<HTMLFormElement>;
};
