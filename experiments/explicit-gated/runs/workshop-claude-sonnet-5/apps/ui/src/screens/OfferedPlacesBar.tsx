/**
 * A way into the places offered to the participant who is acting.
 *
 * A participant normally arrives at an offer through the link in the message
 * they were sent; this is the same address, reachable from inside the
 * application for anyone who no longer has the message to hand.
 */

import { useEffect, useState } from "react";

import { goTo } from "../navigation";
import { readOffers, ServiceUnreachable, type OfferEntry, type Session } from "../workshopService";

export function OfferedPlacesBar({ session }: { session: Session | null }) {
  const [offers, setOffers] = useState<OfferEntry[]>([]);

  useEffect(() => {
    let current = true;
    if (session === null) {
      setOffers([]);
      return undefined;
    }
    readOffers(session.token)
      .then((answer) => {
        if (current) setOffers(answer.body.offers ?? []);
      })
      .catch((cause: unknown) => {
        if (!(cause instanceof ServiceUnreachable)) throw cause;
      });
    return () => {
      current = false;
    };
  }, [session]);

  const waiting = offers.filter((offer) => offer.view === "available");
  if (waiting.length === 0) return undefined;

  return (
    <nav className="offers" aria-label="Places offered to you">
      <span className="offers-lead">A place is being held for you:</span>
      <ul className="offers-list">
        {waiting.map((offer) => (
          <li key={offer.id}>
            <a
              href={`#/offers/${encodeURIComponent(offer.id)}`}
              onClick={(event) => {
                event.preventDefault();
                goTo({ name: "offer", offeredPlaceId: offer.id });
              }}
            >
              {offer.workshopTitle}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
