import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ActionControl,
  DetailWithAction,
  DetailWithNotice,
  FormWithSubmitAction,
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
  WorkshopsOverviewList,
  WorkshopTeaserCard,
  WorkshopTeaserContent
} from "@codex/workshop-design-system";
import "@codex/workshop-design-system/styles.css";
import {
  acceptOffer,
  confirmRegistration,
  declineOffer,
  getOffer,
  joinWaitlist,
  listWorkshops,
  submitRegistrationDetails,
  submitWaitlistDetails,
  type Offer,
  type PersonDetails,
  type Workshop
} from "./workshopClient";
import "./app.css";

type Screen =
  | { name: "overview" }
  | { name: "detail"; slug: string }
  | { name: "registration-form"; slug: string; errors?: Record<string, string> }
  | { name: "registration-review"; slug: string; details: PersonDetails }
  | { name: "waitlist-form"; slug: string; errors?: Record<string, string> }
  | { name: "waitlist-review"; slug: string; details: PersonDetails }
  | { name: "waitlist-after-unavailable"; slug: string }
  | { name: "status"; title: string; message: string; tone?: "error" | "info" | "success" | "warning"; slug?: string }
  | { name: "offer"; token: string; offer?: Offer; slug?: string };

const defaultPerson = {
  name: "Alex Morgan",
  email: "alex.morgan@example.com",
  accessibilityNotes: "Please share materials in advance if possible.",
  notes: "Please notify me if a place opens up."
};

function availabilityLabel(workshop: Workshop) {
  if (workshop.availability === "placeAvailable") return `Open · ${workshop.capacity - workshop.spotsTaken} / ${workshop.capacity} spots`;
  if (workshop.availability === "waitlistOpen") return `Waitlist · ${workshop.spotsTaken} / ${workshop.capacity} spots`;
  return "Registration closed";
}

function statusForWorkshop(workshop: Workshop) {
  return {
    title: workshop.title,
    description: workshop.description,
    date: workshop.date,
    location: workshop.location,
    availability: availabilityLabel(workshop)
  };
}

export function App() {
  const [theme, setTheme] = useState("light");
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [screen, setScreen] = useState<Screen>({ name: "overview" });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    listWorkshops().then(setWorkshops);
  }, []);

  const selected = useMemo(() => {
    const slug = "slug" in screen ? screen.slug : undefined;
    return workshops.find((workshop) => workshop.slug === slug) ?? workshops[1];
  }, [screen, workshops]);

  async function refresh() {
    setWorkshops(await listWorkshops());
  }

  function openDetail(slug: string) {
    setScreen({ name: "detail", slug });
  }

  async function handleRegistrationSubmit(event: FormEvent<HTMLFormElement>, slug: string) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as PersonDetails;
    const result = await submitRegistrationDetails(data);
    if (!result.valid) {
      setScreen({ name: "registration-form", slug, errors: result.errors });
      return;
    }
    setScreen({ name: "registration-review", slug, details: data });
  }

  async function handleWaitlistSubmit(event: FormEvent<HTMLFormElement>, slug: string) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as PersonDetails;
    const result = await submitWaitlistDetails(data);
    if (!result.valid) {
      setScreen({ name: "waitlist-form", slug, errors: result.errors });
      return;
    }
    setScreen({ name: "waitlist-review", slug, details: data });
  }

  async function finishRegistration(slug: string, details: PersonDetails) {
    const result = await confirmRegistration(slug, details);
    await refresh();
    if (result.outcome === "confirmed") setScreen({ name: "status", title: "You are registered", message: "Your spot has been secured.", tone: "success", slug });
    if (result.outcome === "already-confirmed") setScreen({ name: "status", title: "Registration already confirmed", message: "You already have a confirmed place for this workshop.", tone: "info", slug });
    if (result.outcome === "place-unavailable") setScreen({ name: "waitlist-after-unavailable", slug });
    if (result.outcome === "closed") setScreen({ name: "status", title: "Registration closed", message: "This workshop is no longer accepting registrations.", tone: "warning", slug });
  }

  async function finishWaitlist(slug: string, details: PersonDetails) {
    const result = await joinWaitlist(slug, details);
    await refresh();
    if (result.outcome === "waitlisted") setScreen({ name: "status", title: "You are on the waitlist", message: "We will notify you if a spot opens up.", tone: "info", slug });
    if (result.outcome === "already-waitlisted") setScreen({ name: "status", title: "Already waitlisted", message: "You are already on the waitlist for this workshop.", tone: "info", slug });
    if (result.outcome === "closed") setScreen({ name: "status", title: "Registration closed", message: "The waitlist has closed for this workshop.", tone: "warning", slug });
  }

  async function openOffer() {
    const result = await getOffer("offer-demo");
    setScreen({ name: "offer", token: "offer-demo", offer: result.offer, slug: result.workshop.slug });
  }

  async function respondToOffer(kind: "accept" | "decline") {
    if (screen.name !== "offer") return;
    const result = kind === "accept"
      ? await acceptOffer(screen.token, defaultPerson.email)
      : await declineOffer(screen.token, defaultPerson.email);
    await refresh();
    if (result.outcome === "accepted") setScreen({ name: "status", title: "You are registered", message: "Your offered place is now confirmed.", tone: "success", slug: result.workshop.slug });
    if (result.outcome === "declined") setScreen({ name: "status", title: "You are on the waitlist", message: "You declined the offered place and remain on the waitlist.", tone: "info", slug: result.workshop.slug });
    if (result.outcome === "expired") setScreen({ name: "status", title: "Your offer has expired", message: "The reserved spot was not accepted within the time limit.", tone: "warning", slug: result.workshop.slug });
    if (result.outcome === "unavailable") setScreen({ name: "status", title: "This offer is unavailable", message: "The reserved spot is no longer available.", tone: "warning", slug: result.workshop.slug });
    if (result.outcome === "not-authorized") setScreen({ name: "status", title: "Offer unavailable", message: "This offer is reserved for another participant.", tone: "error", slug: result.workshop.slug });
  }

  function renderDetail(workshop: Workshop) {
    if (workshop.participation === "confirmed") {
      return (
        <DetailWithNotice
          detailSummary={<WorkshopDetailSummary {...statusForWorkshop(workshop)} />}
          detailNotice={<StatusNotice tone="success" message="You are already registered for this workshop." />}
        />
      );
    }
    if (workshop.participation === "waitlisted") {
      return (
        <DetailWithNotice
          detailSummary={<WorkshopDetailSummary {...statusForWorkshop(workshop)} />}
          detailNotice={<StatusNotice tone="info" message="You are already on the waitlist for this workshop." />}
        />
      );
    }
    if (workshop.availability === "registrationClosed") {
      return <StatusMessage title="Registration closed" message="This workshop is no longer accepting registrations." tone="warning" details={[{ term: "Workshop", value: workshop.title }]} />;
    }
    const startsWaitlist = workshop.availability === "waitlistOpen";
    return (
        <DetailWithAction
          detailSummary={<WorkshopDetailSummary {...statusForWorkshop(workshop)} />}
          detailAction={
            <ActionControl
              label={startsWaitlist ? "Join waitlist" : "Register"}
              onAction={() => {
                if (startsWaitlist) setScreen({ name: "waitlist-form", slug: workshop.slug });
                else setScreen({ name: "registration-form", slug: workshop.slug });
              }}
            />
          }
        />
    );
  }

  function renderScreen() {
    if (screen.name === "overview") {
      return (
        <>
          <header className="page-heading">
            <h1>Workshops</h1>
            <p>Browse upcoming sessions and register.</p>
            <button className="text-link" type="button" onClick={openOffer}>Open offer email</button>
          </header>
          <WorkshopsOverviewList
            overviewWorkshops={workshops.map((workshop) => (
              <WorkshopTeaserCard
                key={workshop.slug}
                teaserContent={<WorkshopTeaserContent title={workshop.title} summary={workshop.summary} date={workshop.date} location={availabilityLabel(workshop)} />}
                teaserAction={<ActionControl label="View workshop" variant="secondary" onAction={() => openDetail(workshop.slug)} />}
              />
            ))}
            sidebar={<div className="summary-panel"><h2>Your summary</h2><p>Manage registered and waitlisted workshop activity.</p></div>}
          />
        </>
      );
    }
    if (screen.name === "detail" && selected) {
      return (
        <>
          <button className="back-link" type="button" onClick={() => setScreen({ name: "overview" })}>Back to workshops</button>
          {renderDetail(selected)}
        </>
      );
    }
    if (screen.name === "registration-form" && selected) {
      return (
        <>
          <button className="back-link" type="button" onClick={() => setScreen({ name: "detail", slug: selected.slug })}>Back to workshop</button>
          <header className="page-heading"><h1>Register for {selected.title}</h1><p>Fill out the form below to reserve your spot.</p></header>
          <FormWithSubmitAction
            onSubmit={(event) => handleRegistrationSubmit(event, selected.slug)}
            formFields={<RegistrationFormFields {...defaultPerson} errors={screen.errors} />}
            formSubmitAction={<ActionControl label="Continue" type="submit" />}
          />
        </>
      );
    }
    if (screen.name === "registration-review" && selected) {
      return (
        <>
          <header className="page-heading"><h1>Review your registration</h1><p>Please review your details before confirming your spot.</p></header>
          <ReviewWithActions
            reviewSummary={<RegistrationReviewSummary workshopTitle={selected.title} name={screen.details.name} email={screen.details.email} />}
            reviewEditAction={<ActionControl label="Edit details" variant="secondary" onAction={() => setScreen({ name: "registration-form", slug: selected.slug })} />}
            reviewSubmitAction={<ActionControl label="Confirm registration" onAction={() => finishRegistration(selected.slug, screen.details)} />}
          />
        </>
      );
    }
    if (screen.name === "waitlist-after-unavailable" && selected) {
      return (
        <>
          <header className="page-heading"><h1>Join the waitlist instead</h1><p>The registration place is no longer available.</p></header>
          <DetailWithAction
            detailSummary={<WorkshopDetailSummary {...statusForWorkshop({ ...selected, availability: "waitlistOpen" })} />}
            detailAction={<ActionControl label="Join waitlist" onAction={() => setScreen({ name: "waitlist-form", slug: selected.slug })} />}
          />
        </>
      );
    }
    if (screen.name === "waitlist-form" && selected) {
      return (
        <>
          <button className="back-link" type="button" onClick={() => setScreen({ name: "detail", slug: selected.slug })}>Back to workshop</button>
          <header className="page-heading"><h1>Join the waitlist</h1><p>Share your details so we can notify you if a place opens.</p></header>
          <FormWithSubmitAction
            onSubmit={(event) => handleWaitlistSubmit(event, selected.slug)}
            formFields={<WaitlistFormFields name={defaultPerson.name} email={defaultPerson.email} notes={defaultPerson.notes} errors={screen.errors} />}
            formSubmitAction={<ActionControl label="Continue" type="submit" />}
          />
        </>
      );
    }
    if (screen.name === "waitlist-review" && selected) {
      return (
        <>
          <header className="page-heading"><h1>Review waitlist request</h1><p>Please review your details before joining the waitlist.</p></header>
          <ReviewWithActions
            reviewSummary={<WaitlistReviewSummary workshopTitle={selected.title} name={screen.details.name} email={screen.details.email} />}
            reviewEditAction={<ActionControl label="Edit details" variant="secondary" onAction={() => setScreen({ name: "waitlist-form", slug: selected.slug })} />}
            reviewSubmitAction={<ActionControl label="Join waitlist" onAction={() => finishWaitlist(selected.slug, screen.details)} />}
          />
        </>
      );
    }
    if (screen.name === "offer" && selected) {
      return (
        <OfferedPlaceResponse
          offerSummary={<OfferResponseSummary title="A spot is available for you" message="Someone cancelled and a spot is now available. This offer is reserved for you temporarily." workshopTitle={selected.title} expiresAt={screen.offer?.expiresAt ?? "Jun 14, 5:00 PM"} />}
          offerAcceptAction={<ActionControl label="Accept spot" onAction={() => respondToOffer("accept")} />}
          offerDeclineAction={<ActionControl label="Decline" variant="secondary" onAction={() => respondToOffer("decline")} />}
        />
      );
    }
    if (screen.name === "status") {
      return (
        <StatusWithAction
          statusContent={<StatusMessage title={screen.title} message={screen.message} tone={screen.tone} details={screen.slug && selected ? [{ term: "Workshop", value: selected.title }] : []} />}
          statusAction={<ActionControl label="Browse workshops" variant="secondary" onAction={() => setScreen({ name: "overview" })} />}
        />
      );
    }
    return <StatusMessage title="Workshops unavailable" message="The workshop view could not be prepared." tone="error" />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" aria-label="Workshop home" onClick={() => setScreen({ name: "overview" })}>V</button>
        <div className="topbar-actions">
          <button type="button" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>{theme === "light" ? "Dark" : "Light"}</button>
          <button type="button" aria-label="Profile">AM</button>
        </div>
      </header>
      <main>{renderScreen()}</main>
    </div>
  );
}
