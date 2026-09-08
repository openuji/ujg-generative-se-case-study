import {
  DetailWithAction,
  DetailWithNotice,
  WorkshopDetailSummary,
  StatusNotice,
  StatusMessage,
  ActionControl,
  Card
} from "@workshop-claude-sonnet/design-system";
import { getWorkshopDetail } from "../api";
import { useAsyncData } from "../useAsyncData";
import { useNavigate } from "../router";

export function WorkshopDetailPage({ workshopId }: { workshopId: string }) {
  const [state] = useAsyncData(() => getWorkshopDetail(workshopId), [workshopId]);
  const navigate = useNavigate();

  if (state.status === "loading") return <p className="p-6 text-ink-muted">Loading workshop…</p>;
  if (state.status === "error") return <p className="p-6 text-error-ink">This workshop could not be found.</p>;

  const workshop = state.data;
  const summary = (
    <WorkshopDetailSummary
      title={workshop.title}
      description={workshop.description}
      date={workshop.date}
      location={workshop.location}
      availability={workshop.availability}
    />
  );

  let content;
  if (workshop.participantStatus === "confirmed") {
    content = (
      <DetailWithNotice
        detailSummary={summary}
        detailNotice={<StatusNotice message="You're already registered for this workshop." tone="info" />}
      />
    );
  } else if (workshop.participantStatus === "waitlisted") {
    content = (
      <DetailWithNotice
        detailSummary={summary}
        detailNotice={<StatusNotice message="You're already on the waitlist for this workshop." tone="info" />}
      />
    );
  } else if (workshop.availability === "placeAvailable") {
    content = (
      <DetailWithAction
        detailSummary={summary}
        detailAction={<ActionControl label="Register" onAction={() => navigate(`/workshops/${workshopId}/register`)} />}
      />
    );
  } else if (workshop.availability === "waitlistOpen") {
    content = (
      <DetailWithAction
        detailSummary={summary}
        detailAction={
          <ActionControl label="Join waitlist" onAction={() => navigate(`/workshops/${workshopId}/waitlist`)} />
        }
      />
    );
  } else {
    content = (
      <Card>
        <StatusMessage title="Registration closed" message="This workshop is no longer accepting registrations or waitlist sign-ups." tone="warning" />
      </Card>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <ActionControl label="Back to workshops" variant="secondary" onAction={() => navigate("/")} />
      {content}
    </div>
  );
}
