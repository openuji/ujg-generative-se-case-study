/**
 * Saying who is asking.
 *
 * The service has no identity provider yet, so this is a plain chooser over
 * the participants it has. It is application furniture, not one of the
 * product's screens.
 */

import { useEffect, useState } from "react";
import { ActionControl } from "@workshop/design-system";

import {
  readSignInDirectory,
  refusalText,
  ServiceUnreachable,
  signIn,
  signOut,
  type Participant,
  type Session
} from "../workshopService";

export function SignInBar({
  session,
  onChange
}: {
  session: Session | null;
  onChange: (session: Session | null) => void;
}) {
  const [directory, setDirectory] = useState<Participant[]>([]);
  const [chosen, setChosen] = useState("");
  const [trouble, setTrouble] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    readSignInDirectory()
      .then((answer) => {
        if (!current) return;
        setDirectory(answer.body.participants);
        setChosen((existing) => existing === "" ? answer.body.participants[0]?.id ?? "" : existing);
      })
      .catch((cause: unknown) => {
        if (current) setTrouble(cause instanceof ServiceUnreachable ? cause.message : String(cause));
      });
    return () => {
      current = false;
    };
  }, []);

  if (session !== null) {
    return (
      <div className="sign-in">
        <span className="sign-in-who">
          Acting as <strong>{session.participant.name}</strong>
        </span>
        <ActionControl
          label="Sign out"
          variant="secondary"
          onActivate={() => {
            void signOut(session.token).catch(() => undefined);
            onChange(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="sign-in">
      <label className="sign-in-label" htmlFor="sign-in-participant">
        Act as
      </label>
      <select
        id="sign-in-participant"
        className="sign-in-choice"
        value={chosen}
        onChange={(event) => setChosen(event.target.value)}
      >
        {directory.map((participant) => (
          <option key={participant.id} value={participant.id}>
            {participant.name}
          </option>
        ))}
      </select>
      <ActionControl
        label="Sign in"
        disabled={chosen === ""}
        onActivate={() => {
          void signIn(chosen)
            .then((answer) => {
              if (!answer.ok) {
                setTrouble(refusalText(answer.body, "That participant could not be signed in."));
                return;
              }
              setTrouble(null);
              onChange(answer.body as Session);
            })
            .catch((cause: unknown) => {
              setTrouble(cause instanceof ServiceUnreachable ? cause.message : String(cause));
            });
        }}
      />
      {trouble === null ? undefined : (
        <span className="chrome-trouble" role="alert">
          {trouble}
        </span>
      )}
    </div>
  );
}
