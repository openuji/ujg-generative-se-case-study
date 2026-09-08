import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  ActionControl,
  DetailWithAction,
  DetailWithNotice,
  EmailLinkControl,
  EmailOfferContent,
  EmailOfferMessage,
  FormWithSubmit,
  OfferedPlaceResponse,
  OfferResponseSummary,
  RegistrationFormFields,
  RegistrationReviewSummary,
  ReviewWithActions,
  StatusMessage,
  StatusNotice,
  StatusWithAction,
  ThemeStyleProvider,
  WaitlistFormFields,
  WaitlistReviewSummary,
  WorkshopDetailSummary,
  WorkshopTeaserCard,
  WorkshopTeaserContent,
  WorkshopsOverviewList,
  defaultThemeName,
  themeOptions
} from "@workshop/design-system";
import {
  acceptOffer,
  confirmRegistration,
  continueAsWaitlisted,
  declineOffer,
  joinWaitlist,
  listWorkshops,
  loadOffer,
  loadOfferEmail,
  loadWorkshop,
  type EmailResponse,
  type OfferResponse,
  type RegistrationErrors,
  type RegistrationValues,
  type StatusData,
  type WaitlistErrors,
  type WaitlistValues,
  type WorkshopResponse,
  type WorkshopTeaser
} from "./api";

type Route =
  | { kind: "overview" }
  | { kind: "workshop"; slug: string }
  | { kind: "offer"; offerId: string }
  | { kind: "email"; offerId: string };

type DetailMode =
  | "detail"
  | "registrationForm"
  | "registrationReview"
  | "waitlistPrompt"
  | "waitlistForm"
  | "waitlistReview"
  | "status"
  | "alreadyWaitlistedStatus";

type RegistrationFormState = RegistrationValues & { errors?: RegistrationErrors };
type WaitlistFormState = WaitlistValues & { errors?: WaitlistErrors };

const emptyRegistration: RegistrationFormState = {
  name: "",
  email: "",
  accessibilityNotes: ""
};

const emptyWaitlist: WaitlistFormState = {
  name: "",
  email: "",
  notes: ""
};

function readRoute(): Route {
  const params = new URLSearchParams(window.location.search);
  const offerId = params.get("offer");
  if (offerId) return { kind: "offer", offerId };
  const emailOfferId = params.get("email");
  if (emailOfferId) return { kind: "email", offerId: emailOfferId };
  const slug = params.get("workshop");
  return slug ? { kind: "workshop", slug } : { kind: "overview" };
}

function pathFor(route: Route) {
  const params = new URLSearchParams();
  if (route.kind === "workshop") params.set("workshop", route.slug);
  if (route.kind === "offer") params.set("offer", route.offerId);
  if (route.kind === "email") params.set("email", route.offerId);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function registrationFromForm(form: HTMLFormElement): RegistrationFormState {
  const data = new FormData(form);
  return {
    name: String(data.get("name") ?? "").trim(),
    email: normalizeEmail(String(data.get("email") ?? "")),
    accessibilityNotes: String(data.get("accessibilityNotes") ?? "").trim()
  };
}

function waitlistFromForm(form: HTMLFormElement): WaitlistFormState {
  const data = new FormData(form);
  return {
    name: String(data.get("name") ?? "").trim(),
    email: normalizeEmail(String(data.get("email") ?? "")),
    notes: String(data.get("notes") ?? "").trim()
  };
}

function validateRegistration(values: RegistrationValues) {
  const errors: RegistrationErrors = {};
  if (!values.name) errors.name = "Enter your full name.";
  if (!validEmail(values.email)) errors.email = "Enter a valid email address.";
  return { valid: Object.keys(errors).length === 0, errors };
}

function validateWaitlist(values: WaitlistValues) {
  const errors: WaitlistErrors = {};
  if (!values.name) errors.name = "Enter your full name.";
  if (!validEmail(values.email)) errors.email = "Enter a valid email address.";
  return { valid: Object.keys(errors).length === 0, errors };
}

function detailHeading(response: WorkshopResponse | null) {
  if (!response) return "";
  if ("detail" in response) return response.detail.title;
  return response.status.title;
}

export function App() {
  const [themeName, setThemeName] = useState(defaultThemeName);
  const [route, setRoute] = useState<Route>(() => readRoute());
  const [workshops, setWorkshops] = useState<WorkshopTeaser[]>([]);
  const [workshopResponse, setWorkshopResponse] = useState<WorkshopResponse | null>(null);
  const [offerResponse, setOfferResponse] = useState<OfferResponse | null>(null);
  const [emailResponse, setEmailResponse] = useState<EmailResponse | null>(null);
  const [detailMode, setDetailMode] = useState<DetailMode>("detail");
  const [registrationForm, setRegistrationForm] = useState<RegistrationFormState>(emptyRegistration);
  const [waitlistForm, setWaitlistForm] = useState<WaitlistFormState>(emptyWaitlist);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onPopState = () => setRoute(readRoute());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function navigate(next: Route) {
    window.history.pushState(null, "", pathFor(next));
    setRoute(next);
  }

  const currentWorkshopSlug = route.kind === "workshop" ? route.slug : "";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setStatus(null);

    async function load() {
      try {
        if (route.kind === "overview") {
          const response = await listWorkshops();
          if (!cancelled) setWorkshops(response.workshops);
        } else if (route.kind === "workshop") {
          const response = await loadWorkshop(route.slug);
          if (!cancelled) {
            setWorkshopResponse(response);
            setDetailMode("detail");
            setRegistrationForm(emptyRegistration);
            setWaitlistForm(emptyWaitlist);
          }
        } else if (route.kind === "offer") {
          const response = await loadOffer(route.offerId);
          if (!cancelled) setOfferResponse(response);
        } else {
          const response = await loadOfferEmail(route.offerId);
          if (!cancelled) setEmailResponse(response);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load this screen.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [route]);

  const title = useMemo(() => {
    if (route.kind === "overview") return "Workshops";
    if (route.kind === "workshop") return detailHeading(workshopResponse);
    if (route.kind === "email") return "Email offer";
    if (offerResponse && "status" in offerResponse) return offerResponse.status.title;
    return "Offered place";
  }, [offerResponse, route.kind, workshopResponse]);

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = registrationFromForm(event.currentTarget);
    const validation = validateRegistration(values);
    if (!validation.valid) {
      setRegistrationForm({ ...values, errors: validation.errors });
      setDetailMode("registrationForm");
      return;
    }
    setRegistrationForm(values);
    setDetailMode("registrationReview");
  }

  async function finishRegistration() {
    setLoading(true);
    setError(null);
    try {
      const response = await confirmRegistration(currentWorkshopSlug, registrationForm);
      if (response.view === "registrationFormError") {
        setRegistrationForm(response.form);
        setDetailMode("registrationForm");
      } else if (response.view === "waitlistPrompt") {
        setWorkshopResponse({ view: "waitlistOpen", detail: response.detail });
        setWaitlistForm({
          name: registrationForm.name,
          email: registrationForm.email,
          notes: ""
        });
        setDetailMode("waitlistPrompt");
      } else {
        setStatus(response.status);
        setDetailMode("status");
      }
    } catch (finishError) {
      setError(finishError instanceof Error ? finishError.message : "Registration could not be confirmed.");
    } finally {
      setLoading(false);
    }
  }

  function submitWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = waitlistFromForm(event.currentTarget);
    const validation = validateWaitlist(values);
    if (!validation.valid) {
      setWaitlistForm({ ...values, errors: validation.errors });
      setDetailMode("waitlistForm");
      return;
    }
    setWaitlistForm(values);
    setDetailMode("waitlistReview");
  }

  async function finishWaitlist() {
    setLoading(true);
    setError(null);
    try {
      const response = await joinWaitlist(currentWorkshopSlug, waitlistForm);
      if (response.view === "waitlistFormError") {
        setWaitlistForm(response.form);
        setDetailMode("waitlistForm");
      } else {
        setStatus(response.status);
        setDetailMode(response.view === "alreadyWaitlisted" ? "alreadyWaitlistedStatus" : "status");
      }
    } catch (finishError) {
      setError(finishError instanceof Error ? finishError.message : "Waitlist request could not be completed.");
    } finally {
      setLoading(false);
    }
  }

  async function continueWaitlisted() {
    setLoading(true);
    setError(null);
    try {
      const response = await continueAsWaitlisted(currentWorkshopSlug);
      if ("status" in response) {
        setStatus(response.status);
        setDetailMode("status");
      }
    } catch (continueError) {
      setError(continueError instanceof Error ? continueError.message : "Unable to continue.");
    } finally {
      setLoading(false);
    }
  }

  async function resolveOffer(command: "accept" | "decline") {
    if (route.kind !== "offer") return;
    setLoading(true);
    setError(null);
    try {
      const response = command === "accept" ? await acceptOffer(route.offerId) : await declineOffer(route.offerId);
      setOfferResponse(response);
    } catch (resolveError) {
      setError(resolveError instanceof Error ? resolveError.message : "Offer response could not be completed.");
    } finally {
      setLoading(false);
    }
  }

  function renderOverview() {
    return (
      <WorkshopsOverviewList
        overviewWorkshops={workshops.map((workshop) => (
          <WorkshopTeaserCard
            key={workshop.slug}
            teaserContent={<WorkshopTeaserContent {...workshop} />}
            teaserAction={<ActionControl label="Open" onAction={() => navigate({ kind: "workshop", slug: workshop.slug })} />}
          />
        ))}
      />
    );
  }

  function renderWorkshopDetail() {
    if (!workshopResponse) return null;
    if (detailMode === "registrationForm") {
      return (
        <FormWithSubmit
          formFields={<RegistrationFormFields {...registrationForm} />}
          formSubmitAction={<ActionControl label="Review registration" type="submit" />}
          onSubmit={submitRegistration}
        />
      );
    }
    if (detailMode === "registrationReview") {
      return (
        <ReviewWithActions
          reviewSummary={
            <RegistrationReviewSummary
              workshopTitle={detailHeading(workshopResponse)}
              name={registrationForm.name}
              email={registrationForm.email}
            />
          }
          reviewEditAction={<ActionControl label="Edit details" variant="secondary" onAction={() => setDetailMode("registrationForm")} />}
          reviewSubmitAction={<ActionControl label="Confirm registration" onAction={finishRegistration} />}
        />
      );
    }
    if (detailMode === "waitlistForm") {
      return (
        <FormWithSubmit
          formFields={<WaitlistFormFields {...waitlistForm} />}
          formSubmitAction={<ActionControl label="Review waitlist request" type="submit" />}
          onSubmit={submitWaitlist}
        />
      );
    }
    if (detailMode === "waitlistReview") {
      return (
        <ReviewWithActions
          reviewSummary={
            <WaitlistReviewSummary
              workshopTitle={detailHeading(workshopResponse)}
              name={waitlistForm.name}
              email={waitlistForm.email}
            />
          }
          reviewEditAction={<ActionControl label="Edit details" variant="secondary" onAction={() => setDetailMode("waitlistForm")} />}
          reviewSubmitAction={<ActionControl label="Join waitlist" onAction={finishWaitlist} />}
        />
      );
    }
    if (detailMode === "status" && status) {
      return <StatusMessage {...status} />;
    }
    if (detailMode === "alreadyWaitlistedStatus" && status) {
      return (
        <StatusWithAction
          statusContent={<StatusMessage {...status} />}
          statusAction={<ActionControl label="Continue" onAction={continueWaitlisted} />}
        />
      );
    }
    if (detailMode === "waitlistPrompt" && "detail" in workshopResponse) {
      return (
        <DetailWithAction
          detailSummary={<WorkshopDetailSummary {...workshopResponse.detail} />}
          detailAction={<ActionControl label="Join waitlist" onAction={() => setDetailMode("waitlistForm")} />}
        />
      );
    }
    if (workshopResponse.view === "registrationClosed") {
      return <StatusMessage {...workshopResponse.status} />;
    }
    if (workshopResponse.view === "alreadyRegistered" || workshopResponse.view === "alreadyWaitlisted") {
      return (
        <DetailWithNotice
          detailSummary={<WorkshopDetailSummary {...workshopResponse.detail} />}
          detailNotice={<StatusNotice {...workshopResponse.notice} />}
        />
      );
    }
    if (workshopResponse.view === "waitlistOpen") {
      return (
        <DetailWithAction
          detailSummary={<WorkshopDetailSummary {...workshopResponse.detail} />}
          detailAction={<ActionControl label="Join waitlist" onAction={() => setDetailMode("waitlistForm")} />}
        />
      );
    }
    return (
      <DetailWithAction
        detailSummary={<WorkshopDetailSummary {...workshopResponse.detail} />}
        detailAction={<ActionControl label="Register" onAction={() => setDetailMode("registrationForm")} />}
      />
    );
  }

  function renderOffer() {
    if (!offerResponse) return null;
    if (offerResponse.view === "offerOpen") {
      return (
        <OfferedPlaceResponse
          offerSummary={<OfferResponseSummary {...offerResponse.offer} />}
          offerAcceptAction={<ActionControl label="Accept place" onAction={() => resolveOffer("accept")} />}
          offerDeclineAction={<ActionControl label="Decline" variant="secondary" onAction={() => resolveOffer("decline")} />}
        />
      );
    }
    return <StatusMessage {...offerResponse.status} />;
  }

  function renderEmail() {
    if (!emailResponse) return null;
    return (
      <EmailOfferMessage
        emailBody={<EmailOfferContent {...emailResponse.content} />}
        emailLinkAction={<EmailLinkControl href={emailResponse.href} label="Open offer" />}
      />
    );
  }

  return (
    <ThemeStyleProvider themeName={themeName}>
      <div className="appShell">
        <header className="topBar">
          <button className="brandButton" type="button" onClick={() => navigate({ kind: "overview" })}>
            Workshop Registration
          </button>
          <nav className="navActions" aria-label="Primary">
            <button type="button" onClick={() => navigate({ kind: "overview" })}>Workshops</button>
            <button type="button" onClick={() => navigate({ kind: "email", offerId: "offer-current" })}>Email</button>
            <button type="button" onClick={() => navigate({ kind: "offer", offerId: "offer-current" })}>Offer</button>
            <a href="/docs">API</a>
          </nav>
          <label className="themePicker">
            <span>Theme</span>
            <select value={themeName} onChange={(event) => setThemeName(event.currentTarget.value)}>
              {themeOptions.map((theme) => (
                <option key={theme.name} value={theme.name}>{theme.label}</option>
              ))}
            </select>
          </label>
        </header>
        <main className="workspace" aria-busy={loading ? "true" : "false"}>
          <section className="screenHeader" aria-labelledby="screen-title">
            <p>{route.kind === "overview" ? "Browse upcoming cohorts" : "Workshop cohort"}</p>
            <h1 id="screen-title">{title}</h1>
          </section>
          {error ? <StatusMessage title="Service unavailable" message={error} tone="error" /> : null}
          {loading ? <p className="loading">Loading</p> : null}
          {!error && route.kind === "overview" ? renderOverview() : null}
          {!error && route.kind === "workshop" ? renderWorkshopDetail() : null}
          {!error && route.kind === "offer" ? renderOffer() : null}
          {!error && route.kind === "email" ? renderEmail() : null}
        </main>
      </div>
    </ThemeStyleProvider>
  );
}
