/**
 * A place a workshop has offered to one participant.
 *
 * Whether this participant may answer at all, and whether the offer is still
 * open to being answered, are both the service's to say. The screen shows
 * whichever of those answers came back.
 */

import { useCallback, useEffect, useState } from "react";
import {
  ActionControl,
  OfferResponseSummary,
  OfferedPlaceResponse,
  StatusMessage
} from "@workshop/design-system";

import {
  acceptOffer,
  declineOffer,
  readOffer,
  refusalText,
  ServiceUnreachable,
  type OfferAnswer,
  type OfferSituation,
  type Session,
  type StatusMessageDocument
} from "../workshopService";
import { Loading, SignInRequired, Trouble } from "./chrome";

export function OfferedPlaceScreen({
  offeredPlaceId,
  session
}: {
  offeredPlaceId: string;
  session: Session | null;
}) {
  const [situation, setSituation] = useState<OfferSituation | null>(null);
  const [answered, setAnswered] = useState<StatusMessageDocument | null>(null);
  const [trouble, setTrouble] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const token = session?.token ?? null;

  const load = useCallback(async () => {
    if (token === null) {
      setSituation(null);
      return;
    }
    const answer = await readOffer(offeredPlaceId, token);
    if (!answer.ok) {
      setSituation(null);
      setTrouble(refusalText(answer.body, "That offered place could not be opened."));
      return;
    }
    setTrouble(null);
    setAnswered(null);
    setSituation(answer.body as OfferSituation);
  }, [offeredPlaceId, token]);

  useEffect(() => {
    let current = true;
    setSituation(null);
    setAnswered(null);
    setTrouble(null);
    load().catch((cause: unknown) => {
      if (current) setTrouble(cause instanceof ServiceUnreachable ? cause.message : String(cause));
    });
    return () => {
      current = false;
    };
  }, [load]);

  const answer = (respond: typeof acceptOffer) => {
    if (token === null) return;
    setBusy(true);
    respond(offeredPlaceId, token)
      .then((given) => {
        if (given.status === 403 || given.status === 404) {
          setTrouble(refusalText(given.body, "That offered place could not be answered."));
          return;
        }
        setAnswered((given.body as OfferAnswer).status);
      })
      .catch((cause: unknown) => {
        setTrouble(cause instanceof ServiceUnreachable ? cause.message : String(cause));
      })
      .finally(() => setBusy(false));
  };

  if (session === null) return <SignInRequired what="answer this offered place" />;
  if (trouble !== null) return <Trouble message={trouble} />;
  if (situation === null) return <Loading what="this offered place" />;

  const settled = answered ?? situation.status;
  if (situation.view !== "available" || settled !== undefined) {
    return (
      <StatusMessage
        title={settled?.title ?? ""}
        message={settled?.message ?? ""}
        tone={settled?.tone}
        details={settled?.details}
      />
    );
  }

  return (
    <OfferedPlaceResponse
      summary={
        <OfferResponseSummary
          title={situation.offer?.title ?? ""}
          message={situation.offer?.message ?? ""}
          workshopTitle={situation.offer?.workshopTitle ?? ""}
          expiresAt={situation.offer?.expiresAt ?? ""}
        />
      }
      acceptAction={<ActionControl label="Take the place" disabled={busy} onActivate={() => answer(acceptOffer)} />}
      declineAction={
        <ActionControl
          label="Pass it on"
          variant="secondary"
          disabled={busy}
          onActivate={() => answer(declineOffer)}
        />
      }
    />
  );
}
