/**
 * The workshop application.
 *
 * It owns where the browser is, who it is acting as, and which step of a flow
 * is on show. It owns nothing else: every fact about a workshop, a place, a
 * waitlist or an offer is asked of the workshop service.
 */

import { useState } from "react";

import { goTo, usePlace } from "./navigation";
import { recallSession, rememberSession } from "./session";
import { OfferedPlaceScreen } from "./screens/OfferedPlaceScreen";
import { OfferedPlacesBar } from "./screens/OfferedPlacesBar";
import { SignInBar } from "./screens/SignInBar";
import { WorkshopScreen } from "./screens/WorkshopScreen";
import { WorkshopsOverview } from "./screens/WorkshopsOverview";
import type { Session } from "./workshopService";

export function App() {
  const [session, setSession] = useState<Session | null>(() => recallSession());
  const place = usePlace();

  const changeSession = (next: Session | null) => {
    rememberSession(next);
    setSession(next);
  };

  return (
    <div className="application">
      <header className="masthead">
        <a
          className="masthead-home"
          href="#/workshops"
          onClick={(event) => {
            event.preventDefault();
            goTo({ name: "workshops" });
          }}
        >
          Workshops
        </a>
        <SignInBar session={session} onChange={changeSession} />
      </header>

      <OfferedPlacesBar session={session} />

      <main className="stage">
        {place.name === "workshop" ? (
          <WorkshopScreen key={`${place.workshopId}:${session?.participant.id ?? ""}`} workshopId={place.workshopId} session={session} />
        ) : undefined}
        {place.name === "offer" ? (
          <OfferedPlaceScreen
            key={`${place.offeredPlaceId}:${session?.participant.id ?? ""}`}
            offeredPlaceId={place.offeredPlaceId}
            session={session}
          />
        ) : undefined}
        {place.name === "workshops" ? <WorkshopsOverview /> : undefined}
      </main>
    </div>
  );
}
