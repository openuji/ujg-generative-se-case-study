import { useCallback, useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import {
  ActionControl,
  DetailWithAction,
  DetailWithNotice,
  FormWithSubmit,
  OfferedPlaceResponse,
  OfferResponseSummary,
  RegistrationFormFields,
  RegistrationReviewSummary,
  ReviewWithActions,
  StatusMessage,
  StatusNotice,
  StatusWithAction,
  WaitlistFormFields,
  WaitlistReviewSummary,
  WorkshopDetailSummary,
  WorkshopTeaserCard,
  WorkshopTeaserContent,
  WorkshopsOverviewList,
  defaultThemeId,
  themeCssProperties,
  themeSlug
} from "@openuji/workshop-registration-design-system";
import { api } from "./api";
import type {
  OfferResponse,
  RegistrationDetailsInput,
  StatusMessageData,
  WaitlistDetailsInput,
  WorkshopCollectionData,
  WorkshopDetailData,
  WorkshopDetailWithNoticeData
} from "./contracts";

type Errors = { name?: string; email?: string; accessibilityNotes?: string; notes?: string };
type DetailActionView = { kind: "detailAction"; workshopId: string; outcome: "registrationOpen" | "waitlistOpen"; data: WorkshopDetailData; afterUnavailable?: boolean };
type DetailNoticeView = { kind: "detailNotice"; data: WorkshopDetailWithNoticeData };
type View =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "overview"; data: WorkshopCollectionData }
  | DetailActionView
  | DetailNoticeView
  | { kind: "registrationForm"; workshopId: string; workshop: WorkshopDetailData; details: RegistrationDetailsInput; errors: Errors }
  | { kind: "registrationReview"; workshopId: string; workshop: WorkshopDetailData; details: RegistrationDetailsInput }
  | { kind: "waitlistForm"; workshopId: string; workshop: WorkshopDetailData; details: WaitlistDetailsInput; errors: Errors }
  | { kind: "waitlistReview"; workshopId: string; workshop: WorkshopDetailData; details: WaitlistDetailsInput }
  | { kind: "status"; data: StatusMessageData; alreadyWaitlisted?: boolean }
  | { kind: "offer"; offerId: string; data: Extract<OfferResponse, { outcome: "open" }>["data"] };

const emptyRegistration: RegistrationDetailsInput = { name: "", email: "", accessibilityNotes: "" };
const emptyWaitlist: WaitlistDetailsInput = { name: "", email: "", notes: "" };
const messageFrom = (error: unknown) => error instanceof Error ? error.message : "An unexpected error occurred.";
const statusData = (data: StatusMessageData) => <StatusMessage {...data} />;
const detailNoticeData = (data: WorkshopDetailWithNoticeData) => (
  <DetailWithNotice
    summary={<WorkshopDetailSummary {...data.summary} />}
    notice={<StatusNotice {...data.notice} />}
  />
);

function valuesFrom(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
  const form = event.currentTarget.form;
  return new FormData(form ?? undefined);
}

function validate(form: FormData): Errors {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  return {
    ...(!name ? { name: "Enter a full name." } : {}),
    ...(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { email: "Enter a valid email address." } : {})
  };
}

export function App() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [view, setView] = useState<View>({ kind: "loading" });
  const [busy, setBusy] = useState(false);

  const navigate = useCallback((next: string) => {
    window.history.pushState({}, "", next);
    setPathname(next);
  }, []);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    let current = true;
    setView({ kind: "loading" });
    const load = async () => {
      try {
        const workshopMatch = /^\/workshops\/([^/]+)$/.exec(pathname);
        const offerMatch = /^\/offers\/([^/]+)$/.exec(pathname);
        if (workshopMatch) {
          const workshopId = decodeURIComponent(workshopMatch[1]!);
          const result = await api.getWorkshop(workshopId);
          if (!current) return;
          setView(result.outcome === "registrationClosed"
            ? { kind: "status", data: result.data }
            : result.outcome === "alreadyRegistered" || result.outcome === "alreadyWaitlisted"
              ? { kind: "detailNotice", data: result.data }
              : { kind: "detailAction", workshopId, outcome: result.outcome, data: result.data });
          return;
        }
        if (offerMatch) {
          const offerId = decodeURIComponent(offerMatch[1]!);
          const result = await api.getOffer(offerId);
          if (!current) return;
          setView(result.outcome === "open"
            ? { kind: "offer", offerId, data: result.data }
            : { kind: "status", data: result.data });
          return;
        }
        if (pathname !== "/") {
          window.history.replaceState({}, "", "/");
          setPathname("/");
          return;
        }
        const result = await api.listWorkshops();
        if (current) setView({ kind: "overview", data: result.data });
      } catch (error) {
        if (current) setView({ kind: "error", message: messageFrom(error) });
      }
    };
    void load();
    return () => { current = false; };
  }, [pathname]);

  const confirmRegistration = async (current: Extract<View, { kind: "registrationReview" }>) => {
    setBusy(true);
    try {
      const result = await api.confirmRegistration(current.workshopId, current.details);
      setView(result.outcome === "waitlistOpen"
        ? { kind: "detailAction", workshopId: current.workshopId, outcome: "waitlistOpen", data: result.data, afterUnavailable: true }
        : { kind: "status", data: result.data });
    } catch (error) {
      setView({ kind: "error", message: messageFrom(error) });
    } finally { setBusy(false); }
  };

  const joinWaitlist = async (current: Extract<View, { kind: "waitlistReview" }>) => {
    setBusy(true);
    try {
      const result = await api.joinWaitlist(current.workshopId, current.details);
      setView({ kind: "status", data: result.data, alreadyWaitlisted: result.outcome === "alreadyWaitlisted" });
    } catch (error) {
      setView({ kind: "error", message: messageFrom(error) });
    } finally { setBusy(false); }
  };

  const resolveOffer = async (current: Extract<View, { kind: "offer" }>, resolution: "accept" | "decline") => {
    setBusy(true);
    try {
      const result = resolution === "accept" ? await api.acceptOffer(current.offerId) : await api.declineOffer(current.offerId);
      setView({ kind: "status", data: result.data });
    } catch (error) {
      setView({ kind: "error", message: messageFrom(error) });
    } finally { setBusy(false); }
  };

  let content;
  if (view.kind === "loading") content = <p className="runtime-message" role="status">Loading…</p>;
  else if (view.kind === "error") content = <StatusMessage title="Unable to continue" message={view.message} tone="error" />;
  else if (view.kind === "overview") content = (
    <WorkshopsOverviewList workshops={view.data.items.map((item) => (
      <WorkshopTeaserCard
        key={item.workshopId}
        content={<WorkshopTeaserContent {...item.data} />}
        action={<ActionControl label="Open workshop" onAction={() => navigate(`/workshops/${item.workshopId}`)} />}
      />
    ))} />
  );
  else if (view.kind === "detailAction") content = (
    <DetailWithAction
      summary={<WorkshopDetailSummary {...view.data} />}
      action={<ActionControl
        label={view.outcome === "registrationOpen" ? "Register" : view.afterUnavailable ? "Join waitlist instead" : "Join waitlist"}
        onAction={() => setView(view.outcome === "registrationOpen"
          ? { kind: "registrationForm", workshopId: view.workshopId, workshop: view.data, details: emptyRegistration, errors: {} }
          : { kind: "waitlistForm", workshopId: view.workshopId, workshop: view.data, details: emptyWaitlist, errors: {} })}
      />}
    />
  );
  else if (view.kind === "detailNotice") content = detailNoticeData(view.data);
  else if (view.kind === "registrationForm") content = (
    <FormWithSubmit
      fields={<RegistrationFormFields {...view.details} errors={view.errors} />}
      submitAction={<ActionControl label="Continue" onAction={(event) => {
        const form = valuesFrom(event);
        const errors = validate(form);
        const details = {
          name: String(form.get("name") ?? "").trim(),
          email: String(form.get("email") ?? "").trim(),
          accessibilityNotes: String(form.get("accessibilityNotes") ?? "").trim()
        };
        setView(Object.keys(errors).length
          ? { ...view, details, errors }
          : { kind: "registrationReview", workshopId: view.workshopId, workshop: view.workshop, details });
      }} />}
    />
  );
  else if (view.kind === "registrationReview") content = (
    <ReviewWithActions
      summary={<RegistrationReviewSummary workshopTitle={view.workshop.title} name={view.details.name} email={view.details.email} />}
      editAction={<ActionControl label="Edit details" variant="secondary" onAction={() => setView({ ...view, kind: "registrationForm", errors: {} })} />}
      submitAction={<ActionControl disabled={busy} label="Confirm registration" onAction={() => void confirmRegistration(view)} />}
    />
  );
  else if (view.kind === "waitlistForm") content = (
    <FormWithSubmit
      fields={<WaitlistFormFields {...view.details} errors={view.errors} />}
      submitAction={<ActionControl label="Continue" onAction={(event) => {
        const form = valuesFrom(event);
        const errors = validate(form);
        const details = {
          name: String(form.get("name") ?? "").trim(),
          email: String(form.get("email") ?? "").trim(),
          notes: String(form.get("notes") ?? "").trim()
        };
        setView(Object.keys(errors).length
          ? { ...view, details, errors }
          : { kind: "waitlistReview", workshopId: view.workshopId, workshop: view.workshop, details });
      }} />}
    />
  );
  else if (view.kind === "waitlistReview") content = (
    <ReviewWithActions
      summary={<WaitlistReviewSummary workshopTitle={view.workshop.title} name={view.details.name} email={view.details.email} />}
      editAction={<ActionControl label="Edit details" variant="secondary" onAction={() => setView({ ...view, kind: "waitlistForm", errors: {} })} />}
      submitAction={<ActionControl disabled={busy} label="Join waitlist" onAction={() => void joinWaitlist(view)} />}
    />
  );
  else if (view.kind === "offer") content = (
    <OfferedPlaceResponse
      summary={<OfferResponseSummary {...view.data} />}
      acceptAction={<ActionControl disabled={busy} label="Accept place" onAction={() => void resolveOffer(view, "accept")} />}
      declineAction={<ActionControl disabled={busy} label="Decline place" variant="secondary" onAction={() => void resolveOffer(view, "decline")} />}
    />
  );
  else if (view.alreadyWaitlisted) content = (
    <StatusWithAction
      status={statusData(view.data)}
      action={<ActionControl label="Continue" onAction={() => setView({
        kind: "status",
        data: { title: "Waitlisted", message: "You remain on the waitlist for this workshop.", tone: "info", details: view.data.details }
      })} />}
    />
  );
  else content = statusData(view.data);

  const themeStyle = { ...themeCssProperties(defaultThemeId), minHeight: "100vh" } as CSSProperties;
  return (
    <div className="app-shell bg-surface-canvas font-sans text-text-default" data-ujg-theme={themeSlug(defaultThemeId)} style={themeStyle}>
      <main className={`app-frame ${view.kind === "overview" ? "" : "app-frame--focused"}`}>{content}</main>
    </div>
  );
}
