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

export type StatusMessageData = {
  title: string;
  message: string;
  tone?: "error" | "info" | "success" | "warning";
  details?: Array<{
    term: string;
    value: string;
  }>;
};

export type StatusNoticeData = {
  message: string;
  tone?: "error" | "info" | "success" | "warning";
};

export type RegistrationDetailsInput = {
  name: string;
  email: string;
  accessibilityNotes?: string;
};

export type WaitlistDetailsInput = {
  name: string;
  email: string;
  notes?: string;
};

export type WorkshopCollectionData = {
  items: Array<{
    workshopId: string;
    data: WorkshopTeaserData;
  }>;
};

export type WorkshopDetailWithNoticeData = {
  summary: WorkshopDetailData;
  notice: StatusNoticeData;
};

export type WorkshopCollectionResponse = {
  outcome: "overview";
  data: WorkshopCollectionData;
};

export type WorkshopDetailResponse =
  | { outcome: "alreadyRegistered"; data: WorkshopDetailWithNoticeData }
  | { outcome: "alreadyWaitlisted"; data: WorkshopDetailWithNoticeData }
  | { outcome: "registrationOpen"; data: WorkshopDetailData }
  | { outcome: "waitlistOpen"; data: WorkshopDetailData }
  | { outcome: "registrationClosed"; data: StatusMessageData };

export type RegistrationOutcomeResponse =
  | { outcome: "alreadyConfirmed"; data: StatusMessageData }
  | { outcome: "confirmed"; data: StatusMessageData }
  | { outcome: "waitlistOpen"; data: WorkshopDetailData }
  | { outcome: "registrationClosed"; data: StatusMessageData };

export type WaitlistOutcomeResponse =
  | { outcome: "waitlisted"; data: StatusMessageData }
  | { outcome: "alreadyWaitlisted"; data: StatusMessageData }
  | { outcome: "registrationClosed"; data: StatusMessageData };

export type OfferResponse =
  | {
    outcome: "open";
    data: {
      title: string;
      message: string;
      workshopTitle: string;
      expiresAt: string;
    };
  }
  | { outcome: "expired"; data: StatusMessageData }
  | { outcome: "unavailable"; data: StatusMessageData }
  | { outcome: "accepted"; data: StatusMessageData }
  | { outcome: "declined"; data: StatusMessageData };

export type AcceptOfferOutcomeResponse =
  | { outcome: "accepted"; data: StatusMessageData }
  | { outcome: "expired"; data: StatusMessageData }
  | { outcome: "unavailable"; data: StatusMessageData };

export type DeclineOfferOutcomeResponse =
  | { outcome: "declined"; data: StatusMessageData }
  | { outcome: "expired"; data: StatusMessageData }
  | { outcome: "unavailable"; data: StatusMessageData };
