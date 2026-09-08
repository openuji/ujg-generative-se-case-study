import { useState } from "react";
import {
  FormWithSubmit,
  WaitlistFormFields,
  ReviewWithActions,
  WaitlistReviewSummary,
  StatusWithAction,
  StatusMessage,
  ActionControl,
  Card
} from "@workshop-claude-sonnet/design-system";
import { getWorkshopDetail, submitWaitlist } from "../api";
import { useAsyncData } from "../useAsyncData";
import { useNavigate } from "../router";
import { validateContactDetails, type ContactDetailsErrors } from "../registrationValidation";

interface FormValues {
  name: string;
  email: string;
  notes: string;
}

type Step =
  | { kind: "form"; values: FormValues; errors?: ContactDetailsErrors }
  | { kind: "review"; values: FormValues }
  | { kind: "waitlisted" }
  | { kind: "alreadyWaitlisted" }
  | { kind: "closed" };

const EMPTY_VALUES: FormValues = { name: "", email: "", notes: "" };

export function WaitlistPage({ workshopId }: { workshopId: string }) {
  const [workshopState] = useAsyncData(() => getWorkshopDetail(workshopId), [workshopId]);
  const [step, setStep] = useState<Step>({ kind: "form", values: EMPTY_VALUES });
  const navigate = useNavigate();

  if (workshopState.status === "loading") return <p className="p-6 text-ink-muted">Loading…</p>;
  if (workshopState.status === "error") return <p className="p-6 text-error-ink">This workshop could not be found.</p>;

  function handleFormSubmit(formData: FormData) {
    const values: FormValues = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      notes: String(formData.get("notes") ?? "")
    };
    const errors = validateContactDetails(values);
    if (Object.keys(errors).length > 0) {
      setStep({ kind: "form", values, errors });
      return;
    }
    setStep({ kind: "review", values });
  }

  async function handleJoin(values: FormValues) {
    const result = await submitWaitlist(workshopId, values);
    if (result.outcome === "waitlisted") setStep({ kind: "waitlisted" });
    else if (result.outcome === "alreadyWaitlisted") setStep({ kind: "alreadyWaitlisted" });
    else setStep({ kind: "closed" });
  }

  if (step.kind === "form") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6 p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-ink">Join the waitlist for {workshopState.data.title}</h1>
        <FormWithSubmit
          onSubmit={handleFormSubmit}
          formFields={
            <WaitlistFormFields
              name={step.values.name}
              email={step.values.email}
              notes={step.values.notes}
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
        <h1 className="text-2xl font-bold text-ink">Review your waitlist request</h1>
        <ReviewWithActions
          reviewSummary={
            <WaitlistReviewSummary workshopTitle={workshopState.data.title} name={step.values.name} email={step.values.email} />
          }
          reviewEditAction={
            <ActionControl label="Edit details" variant="secondary" onAction={() => setStep({ kind: "form", values: step.values })} />
          }
          reviewSubmitAction={<ActionControl label="Join waitlist" onAction={() => handleJoin(step.values)} />}
        />
      </div>
    );
  }

  if (step.kind === "alreadyWaitlisted") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6 p-4 sm:p-6">
        <StatusWithAction
          statusContent={
            <StatusMessage
              title="You're already waitlisted"
              message={`You're already on the waitlist for ${workshopState.data.title}.`}
              tone="info"
            />
          }
          statusAction={<ActionControl label="Continue" onAction={() => setStep({ kind: "waitlisted" })} />}
        />
      </div>
    );
  }

  if (step.kind === "waitlisted") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6 p-4 sm:p-6">
        <Card>
          <StatusMessage
            title="You're on the waitlist"
            message={`We'll email you if a place opens up for ${workshopState.data.title}.`}
            tone="success"
          />
        </Card>
        <ActionControl label="Back to workshops" onAction={() => navigate("/")} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-4 sm:p-6">
      <Card>
        <StatusMessage title="Registration closed" message="This workshop's waitlist is no longer open." tone="warning" />
      </Card>
      <ActionControl label="Back to workshops" onAction={() => navigate("/")} />
    </div>
  );
}
