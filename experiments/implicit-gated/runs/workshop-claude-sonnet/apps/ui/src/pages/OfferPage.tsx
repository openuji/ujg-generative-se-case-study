import { useState, type ReactNode } from "react";
import {
  OfferedPlaceResponse,
  OfferResponseSummary,
  StatusMessage,
  ActionControl,
  Card
} from "@workshop-claude-sonnet/design-system";
import { getOffer, acceptOffer, declineOffer, type Offer, type OfferOutcome } from "../api";
import { useAsyncData } from "../useAsyncData";
import { useNavigate } from "../router";

export function OfferPage({ offerId }: { offerId: string }) {
  const [offerState, reload] = useAsyncData(() => getOffer(offerId), [offerId]);
  const [outcome, setOutcome] = useState<OfferOutcome["outcome"] | undefined>(undefined);
  const navigate = useNavigate();

  if (offerState.status === "loading") return <p className="p-6 text-ink-muted">Loading…</p>;
  if (offerState.status === "error") return <p className="p-6 text-error-ink">This offer could not be found.</p>;

  const offer = offerState.data;

  async function handleAccept() {
    const result = await acceptOffer(offerId);
    setOutcome(result.outcome);
    reload();
  }

  async function handleDecline() {
    const result = await declineOffer(offerId);
    setOutcome(result.outcome);
    reload();
  }

  return <OfferBody offer={offer} outcome={outcome} onAccept={handleAccept} onDecline={handleDecline} onDone={() => navigate("/")} />;
}

function OfferBody({
  offer,
  outcome,
  onAccept,
  onDecline,
  onDone
}: {
  offer: Offer;
  outcome: OfferOutcome["outcome"] | undefined;
  onAccept: () => void;
  onDecline: () => void;
  onDone: () => void;
}) {
  const effectiveOutcome = outcome ?? (offer.status === "open" ? undefined : offer.status);

  if (effectiveOutcome === "confirmed" || offer.status === "accepted") {
    return (
      <Page>
        <Card>
          <StatusMessage title="Place accepted" message={`You're registered for ${offer.workshopTitle}.`} tone="success" />
        </Card>
        <ActionControl label="Back to workshops" onAction={onDone} />
      </Page>
    );
  }

  if (effectiveOutcome === "waitlisted" || offer.status === "declined") {
    return (
      <Page>
        <Card>
          <StatusMessage
            title="Offer declined"
            message={`You'll remain on the waitlist for ${offer.workshopTitle}.`}
            tone="info"
          />
        </Card>
        <ActionControl label="Back to workshops" onAction={onDone} />
      </Page>
    );
  }

  if (effectiveOutcome === "expired" || offer.status === "expired") {
    return (
      <Page>
        <Card>
          <StatusMessage title="Offer expired" message="This offered place is no longer available." tone="warning" />
        </Card>
        <ActionControl label="Back to workshops" onAction={onDone} />
      </Page>
    );
  }

  if (effectiveOutcome === "unavailable") {
    return (
      <Page>
        <Card>
          <StatusMessage title="Offer unavailable" message="This offer can no longer be acted on." tone="warning" />
        </Card>
        <ActionControl label="Back to workshops" onAction={onDone} />
      </Page>
    );
  }

  return (
    <Page>
      <OfferedPlaceResponse
        offerSummary={
          <OfferResponseSummary
            title="A place is available"
            message="Accept before it expires to keep your place."
            workshopTitle={offer.workshopTitle}
            expiresAt={offer.expiresAt}
          />
        }
        offerAcceptAction={<ActionControl label="Accept place" onAction={onAccept} />}
        offerDeclineAction={<ActionControl label="Decline" variant="secondary" onAction={onDecline} />}
      />
    </Page>
  );
}

function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex max-w-xl flex-col gap-6 p-4 sm:p-6">{children}</div>;
}
