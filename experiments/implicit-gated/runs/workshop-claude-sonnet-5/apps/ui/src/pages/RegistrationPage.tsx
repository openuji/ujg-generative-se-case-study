import { useState } from "react";
import {
  FormWithSubmit,
  RegistrationFormFields,
  ReviewWithActions,
  RegistrationReviewSummary,
  DetailWithAction,
  WorkshopDetailSummary,
  StatusMessage,
  ActionControl,
  Card
} from "@workshop-claude-sonnet/design-system";
import { getWorkshopDetail, submitRegistration, type WorkshopDetail } from "../api";
import { useAsyncData } from "../useAsyncData";
import { useNavigate } from "../router";
import { validateContactDetails, type ContactDetailsErrors } from "../registrationValidation";

interface FormValues {
  name: string;
  email: string;
  accessibilityNotes: string;
}

type Step =
  | { kind: "form"; values: FormValues; errors?: ContactDetailsErrors }
  | { kind: "review"; values: FormValues }
  | { kind: "confirmed" }
  | { kind: "alreadyConfirmed" }
  | { kind: "placeUnavailable"; workshop: WorkshopDetail }
  | { kind: "closed" };

const EMPTY_VALUES: FormValues = { name: "", email: "", accessibilityNotes: "" };

export function RegistrationPage({ workshopId }: { workshopId: string }) {
  const [workshopState] = useAsyncData(() => getWorkshopDetail(workshopId), [workshopId]);
  const [step, setStep] = useState<Step>({ kind: "form", values: EMPTY_VALUES });
  const navigate = useNavigate();

  if (workshopState.status === "loading") return <p className="p-6 text-ink-muted">Loading…</p>;
  if (workshopState.status === "error") return <p className="p-6 text-error-ink">This workshop could not be found.</p>;

  function handleFormSubmit(formData: FormData) {
    const values: FormValues = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      accessibilityNotes: String(formData.get("accessibilityNotes") ?? "")
    };
    const errors = validateContactDetails(values);
    if (Object.keys(errors).length > 0) {
      setStep({ kind: "form", values, errors });
      return;
    }
    setStep({ kind: "review", values });
  }

  async function handleConfirm(values: FormValues) {
    const result = await submitRegistration(workshopId, values);
    if (result.outcome === "confirmed") setStep({ kind: "confirmed" });
    else if (result.outcome === "alreadyRegistered") setStep({ kind: "alreadyConfirmed" });
    else if (result.outcome === "placeUnavailable") setStep({ kind: "placeUnavailable", workshop: result.workshop });
    else setStep({ kind: "closed" });
  }

  if (step.kind === "form") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6 p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-ink">Register for {workshopState.data.title}</h1>
        <FormWithSubmit
          onSubmit={handleFormSubmit}
          formFields={
            <RegistrationFormFields
              name={step.values.name}
              email={step.values.email}
              accessibilityNotes={step.values.accessibilityNotes}
              errors={step.errors}
            />
          }
          formSubmitAction={<ActionControl label="Continue" type="submit" />}
        />
      </div>
    );
  }

  if (step.kind === "review") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6 p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-ink">Review your registration</h1>
        <ReviewWithActions
          reviewSummary={
            <RegistrationReviewSummary
              workshopTitle={workshopState.data.title}
              name={step.values.name}
              email={step.values.email}
            />
          }
          reviewEditAction={
            <ActionControl label="Edit details" variant="secondary" onAction={() => setStep({ kind: "form", values: step.values })} />
          }
          reviewSubmitAction={
            <ActionControl label="Confirm registration" onAction={() => handleConfirm(step.values)} />
          }
        />
      </div>
    );
  }

  if (step.kind === "confirmed") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6 p-4 sm:p-6">
        <Card>
          <StatusMessage
            title="Registration confirmed"
            message={`You're registered for ${workshopState.data.title}.`}
            tone="success"
          />
        </Card>
        <ActionControl label="Back to workshops" onAction={() => navigate("/")} />
      </div>
    );
  }

  if (step.kind === "alreadyConfirmed") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6 p-4 sm:p-6">
        <Card>
          <StatusMessage
            title="Already registered"
            message={`You're already registered for ${workshopState.data.title}.`}
            tone="info"
          />
        </Card>
        <ActionControl label="Back to workshops" onAction={() => navigate("/")} />
      </div>
    );
  }

  if (step.kind === "placeUnavailable") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6 p-4 sm:p-6">
        <p className="text-ink-muted">
          That place is no longer available, but you can join the waitlist instead.
        </p>
        <DetailWithAction
          detailSummary={
            <WorkshopDetailSummary
              title={step.workshop.title}
              description={step.workshop.description}
              date={step.workshop.date}
              location={step.workshop.location}
              availability={step.workshop.availability}
            />
          }
          detailAction={<ActionControl label="Join waitlist" onAction={() => navigate(`/workshops/${workshopId}/waitlist`)} />}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-4 sm:p-6">
      <Card>
        <StatusMessage
          title="Registration closed"
          message="This workshop is no longer accepting registrations."
          tone="warning"
        />
      </Card>
      <ActionControl label="Back to workshops" onAction={() => navigate("/")} />
    </div>
  );
}
