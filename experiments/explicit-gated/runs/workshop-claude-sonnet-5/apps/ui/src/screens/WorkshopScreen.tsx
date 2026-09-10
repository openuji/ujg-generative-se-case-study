/**
 * One workshop, from the moment it is opened to whatever the participant ends
 * up with.
 *
 * Everything this screen decides for itself is interaction: which step of the
 * flow is on show and what is currently typed into the form. Every question
 * with an answer that outlives the browser — whether the details hold up,
 * whether the place is still there, whether this participant already has one —
 * is put to the service, and its answer is what moves the flow on.
 */

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  ActionControl,
  DetailWithAction,
  DetailWithNotice,
  FormWithSubmit,
  RegistrationFormFields,
  RegistrationReviewSummary,
  ReviewWithActions,
  StatusMessage,
  StatusNotice,
  StatusWithAction,
  WaitlistFormFields,
  WaitlistReviewSummary,
  WorkshopDetailSummary
} from "@workshop/design-system";

import {
  confirmRegistration,
  joinWaitlist,
  readWaitlistStanding,
  readWorkshop,
  refusalText,
  reviewRegistration,
  reviewWaitlist,
  ServiceUnreachable,
  type RegistrationAnswer,
  type RegistrationFormDocument,
  type RegistrationReviewAnswer,
  type ReviewDocument,
  type Session,
  type StatusMessageDocument,
  type WaitlistAnswer,
  type WaitlistFormDocument,
  type WaitlistReviewAnswer,
  type WorkshopDetailDocument,
  type WorkshopSituation
} from "../workshopService";
import { Loading, SignInRequired, Trouble } from "./chrome";

type Step =
  | { at: "detail" }
  | { at: "registrationForm"; form: RegistrationFormDocument }
  | { at: "registrationReview"; submitted: RegistrationFormDocument; review: ReviewDocument }
  | { at: "waitlistForm"; form: WaitlistFormDocument }
  | { at: "waitlistReview"; submitted: WaitlistFormDocument; review: ReviewDocument }
  | { at: "placeUnavailable"; detail: WorkshopDetailDocument }
  | { at: "alreadyWaitlisted"; status: StatusMessageDocument }
  | { at: "outcome"; status: StatusMessageDocument };

function submittedRegistration(form: HTMLFormElement): RegistrationFormDocument {
  const submitted = new FormData(form);
  const read = (field: string) => {
    const value = submitted.get(field);
    return typeof value === "string" ? value : "";
  };
  return { name: read("name"), email: read("email"), accessibilityNotes: read("accessibilityNotes") };
}

function submittedWaitlist(form: HTMLFormElement): WaitlistFormDocument {
  const submitted = new FormData(form);
  const read = (field: string) => {
    const value = submitted.get(field);
    return typeof value === "string" ? value : "";
  };
  return { name: read("name"), email: read("email"), notes: read("notes") };
}

/** The details a participant has already given the service, ready to be edited. */
function knownRegistrationDetails(session: Session | null): RegistrationFormDocument {
  return session === null ? {} : { name: session.participant.name, email: session.participant.email };
}

function knownWaitlistDetails(session: Session | null): WaitlistFormDocument {
  return session === null ? {} : { name: session.participant.name, email: session.participant.email };
}

export function WorkshopScreen({ workshopId, session }: { workshopId: string; session: Session | null }) {
  const [situation, setSituation] = useState<WorkshopSituation | null>(null);
  const [step, setStep] = useState<Step>({ at: "detail" });
  const [trouble, setTrouble] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const token = session?.token ?? null;

  const load = useCallback(async () => {
    setStep({ at: "detail" });
    const answer = await readWorkshop(workshopId, token);
    if (!answer.ok) {
      setSituation(null);
      setTrouble(refusalText(answer.body, "That workshop could not be opened."));
      return;
    }
    setTrouble(null);
    setSituation(answer.body as WorkshopSituation);
  }, [workshopId, token]);

  useEffect(() => {
    let current = true;
    setSituation(null);
    load().catch((cause: unknown) => {
      if (current) setTrouble(cause instanceof ServiceUnreachable ? cause.message : String(cause));
    });
    return () => {
      current = false;
    };
  }, [load]);

  const attempt = useCallback(async (work: () => Promise<void>) => {
    setBusy(true);
    try {
      await work();
    } catch (cause: unknown) {
      setTrouble(cause instanceof ServiceUnreachable ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }, []);

  // Signing out mid-flow drops the participant back to the workshop itself;
  // there is nothing left for the service to decide on their behalf.
  useEffect(() => {
    if (session === null) setStep({ at: "detail" });
  }, [session]);

  if (trouble !== null) return <Trouble message={trouble} />;
  if (situation === null) return <Loading what="this workshop" />;

  function takeRegistrationReview(answer: RegistrationReviewAnswer, submitted: RegistrationFormDocument) {
    if (answer.outcome === "ready") setStep({ at: "registrationReview", submitted, review: answer.review });
    else setStep({ at: "registrationForm", form: answer.form });
  }

  function takeWaitlistReview(answer: WaitlistReviewAnswer, submitted: WaitlistFormDocument) {
    if (answer.outcome === "ready") setStep({ at: "waitlistReview", submitted, review: answer.review });
    else setStep({ at: "waitlistForm", form: answer.form });
  }

  function takeRegistrationAnswer(answer: RegistrationAnswer) {
    switch (answer.outcome) {
      case "invalidDetails":
        setStep({ at: "registrationForm", form: answer.form });
        return;
      case "placeUnavailable":
        // The place went while the details were being checked over. The
        // waitlist is what is left, so that is what is offered next.
        setStep({ at: "placeUnavailable", detail: answer.detail });
        return;
      default:
        setStep({ at: "outcome", status: answer.status });
    }
  }

  function takeWaitlistAnswer(answer: WaitlistAnswer, onNothingToJoin: () => void) {
    switch (answer.outcome) {
      case "invalidDetails":
        setStep({ at: "waitlistForm", form: answer.form });
        return;
      case "alreadyWaitlisted":
        setStep({ at: "alreadyWaitlisted", status: answer.status });
        return;
      case "unsupported":
        // There is no waitlist here to join. Show the workshop as it stands.
        onNothingToJoin();
        return;
      default:
        setStep({ at: "outcome", status: answer.status });
    }
  }

  const startRegistration = () =>
    setStep({ at: "registrationForm", form: knownRegistrationDetails(session) });

  const startWaitlist = () => setStep({ at: "waitlistForm", form: knownWaitlistDetails(session) });

  const onRegistrationSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (token === null) return;
    const submitted = submittedRegistration(event.currentTarget);
    void attempt(async () => {
      const answer = await reviewRegistration(workshopId, submitted, token);
      if (answer.status === 404) {
        setTrouble(refusalText(answer.body, "That workshop could not be opened."));
        return;
      }
      takeRegistrationReview(answer.body as RegistrationReviewAnswer, submitted);
    });
  };

  const onWaitlistSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (token === null) return;
    const submitted = submittedWaitlist(event.currentTarget);
    void attempt(async () => {
      const answer = await reviewWaitlist(workshopId, submitted, token);
      if (answer.status === 404) {
        setTrouble(refusalText(answer.body, "That workshop could not be opened."));
        return;
      }
      takeWaitlistReview(answer.body as WaitlistReviewAnswer, submitted);
    });
  };

  switch (step.at) {
    case "registrationForm":
      return (
        <FormWithSubmit
          label={`Register for ${situation.detail.title}`}
          onSubmit={onRegistrationSubmit}
          fields={
            <RegistrationFormFields
              name={step.form.name}
              email={step.form.email}
              accessibilityNotes={step.form.accessibilityNotes}
              errors={step.form.errors}
            />
          }
          submitAction={<ActionControl label="Continue" behavior="submit" disabled={busy} />}
        />
      );

    case "registrationReview":
      return (
        <ReviewWithActions
          summary={
            <RegistrationReviewSummary
              workshopTitle={step.review.workshopTitle}
              name={step.review.name}
              email={step.review.email}
            />
          }
          editAction={
            <ActionControl
              label="Edit details"
              variant="secondary"
              disabled={busy}
              onActivate={() => setStep({ at: "registrationForm", form: step.submitted })}
            />
          }
          submitAction={
            <ActionControl
              label="Confirm registration"
              disabled={busy}
              onActivate={() =>
                void attempt(async () => {
                  if (token === null) return;
                  const answer = await confirmRegistration(workshopId, step.submitted, token);
                  if (answer.status === 404) {
                    setTrouble(refusalText(answer.body, "That workshop could not be opened."));
                    return;
                  }
                  takeRegistrationAnswer(answer.body as RegistrationAnswer);
                })
              }
            />
          }
        />
      );

    case "waitlistForm":
      return (
        <FormWithSubmit
          label={`Join the waitlist for ${situation.detail.title}`}
          onSubmit={onWaitlistSubmit}
          fields={
            <WaitlistFormFields
              name={step.form.name}
              email={step.form.email}
              notes={step.form.notes}
              errors={step.form.errors}
            />
          }
          submitAction={<ActionControl label="Continue" behavior="submit" disabled={busy} />}
        />
      );

    case "waitlistReview":
      return (
        <ReviewWithActions
          summary={
            <WaitlistReviewSummary
              workshopTitle={step.review.workshopTitle}
              name={step.review.name}
              email={step.review.email}
            />
          }
          editAction={
            <ActionControl
              label="Edit details"
              variant="secondary"
              disabled={busy}
              onActivate={() => setStep({ at: "waitlistForm", form: step.submitted })}
            />
          }
          submitAction={
            <ActionControl
              label="Join the waitlist"
              disabled={busy}
              onActivate={() =>
                void attempt(async () => {
                  if (token === null) return;
                  const answer = await joinWaitlist(workshopId, step.submitted, token);
                  if (answer.status === 404) {
                    setTrouble(refusalText(answer.body, "That workshop could not be opened."));
                    return;
                  }
                  takeWaitlistAnswer(answer.body as WaitlistAnswer, () => void load());
                })
              }
            />
          }
        />
      );

    case "placeUnavailable":
      return (
        <DetailWithAction
          summary={
            <WorkshopDetailSummary
              title={step.detail.title}
              description={step.detail.description}
              date={step.detail.date}
              location={step.detail.location}
              availability={step.detail.availability}
            />
          }
          action={<ActionControl label="Join the waitlist instead" disabled={busy} onActivate={startWaitlist} />}
        />
      );

    case "alreadyWaitlisted":
      return (
        <StatusWithAction
          content={
            <StatusMessage
              title={step.status.title}
              message={step.status.message}
              tone={step.status.tone}
              details={step.status.details}
            />
          }
          action={
            <ActionControl
              label="Continue"
              disabled={busy}
              onActivate={() =>
                void attempt(async () => {
                  if (token === null) return;
                  const answer = await readWaitlistStanding(workshopId, token);
                  if (!answer.ok) {
                    setTrouble(refusalText(answer.body, "That waitlist standing could not be read."));
                    return;
                  }
                  setStep({ at: "outcome", status: (answer.body as { status: StatusMessageDocument }).status });
                })
              }
            />
          }
        />
      );

    case "outcome":
      return (
        <StatusMessage
          title={step.status.title}
          message={step.status.message}
          tone={step.status.tone}
          details={step.status.details}
        />
      );

    default:
      break;
  }

  const detail = (
    <WorkshopDetailSummary
      title={situation.detail.title}
      description={situation.detail.description}
      date={situation.detail.date}
      location={situation.detail.location}
      availability={situation.detail.availability}
    />
  );

  switch (situation.view) {
    case "registrationOpen":
      return (
        <>
          {session === null ? <SignInRequired what="register for this workshop" /> : undefined}
          <DetailWithAction
            summary={detail}
            action={<ActionControl label="Register" disabled={session === null} onActivate={startRegistration} />}
          />
        </>
      );

    case "waitlistOpen":
      return (
        <>
          {session === null ? <SignInRequired what="join this waitlist" /> : undefined}
          <DetailWithAction
            summary={detail}
            action={<ActionControl label="Join the waitlist" disabled={session === null} onActivate={startWaitlist} />}
          />
        </>
      );

    case "alreadyRegistered":
    case "alreadyWaitlisted":
      return (
        <DetailWithNotice
          summary={detail}
          notice={<StatusNotice message={situation.notice?.message ?? ""} tone={situation.notice?.tone} />}
        />
      );

    default:
      return (
        <StatusMessage
          title={situation.status?.title ?? ""}
          message={situation.status?.message ?? ""}
          tone={situation.status?.tone}
          details={situation.status?.details}
        />
      );
  }
}
