/**
 * The application's own furniture: waiting, trouble reaching the service, and
 * the prompt to say who is asking. None of it belongs to the product's
 * screens, so none of it borrows their parts.
 */

export function Loading({ what }: { what: string }) {
  return (
    <p className="chrome-waiting" role="status">
      Loading {what}…
    </p>
  );
}

export function Trouble({ message }: { message: string }) {
  return (
    <p className="chrome-trouble" role="alert">
      {message}
    </p>
  );
}

export function SignInRequired({ what }: { what: string }) {
  return (
    <p className="chrome-trouble" role="status">
      Choose a participant above to {what}.
    </p>
  );
}
