/**
 * Validation of the details a participant submits before registering for a
 * workshop or joining its waitlist.
 *
 * A submitted document is valid when it satisfies the product's form contract
 * and each field carries a usable value. An invalid submission comes back as
 * the same form document with an `errors` entry per field at fault, which is
 * exactly what the form screen renders.
 */

const maximumNameLength = 120;
const maximumNotesLength = 500;

function trimmed(value) {
  return typeof value === "string" ? value.trim() : "";
}

function nameProblem(value) {
  const name = trimmed(value);
  if (name.length === 0) return "Enter the name the place should be booked under.";
  if (name.length > maximumNameLength) return `Use ${maximumNameLength} characters or fewer.`;
  return undefined;
}

function emailProblem(value) {
  const email = trimmed(value);
  if (email.length === 0) return "Enter an email address we can send confirmations to.";
  const at = email.indexOf("@");
  const domain = email.slice(at + 1);
  if (at < 1 || domain.length < 3 || !domain.includes(".") || domain.startsWith(".") || domain.endsWith(".")) {
    return "Enter an email address in the form name@example.com.";
  }
  if (/\s/.test(email)) return "An email address cannot contain spaces.";
  return undefined;
}

function notesProblem(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return "Use plain text.";
  if (value.length > maximumNotesLength) return `Use ${maximumNotesLength} characters or fewer.`;
  return undefined;
}

function checkDetails(submitted, notesField) {
  const problems = {};
  const name = nameProblem(submitted.name);
  if (name !== undefined) problems.name = name;
  const email = emailProblem(submitted.email);
  if (email !== undefined) problems.email = email;
  const notes = notesProblem(submitted[notesField]);
  if (notes !== undefined) problems[notesField] = notes;

  const details = {
    name: trimmed(submitted.name),
    email: trimmed(submitted.email)
  };
  const notesValue = trimmed(submitted[notesField]);
  if (notesValue.length > 0) details[notesField] = notesValue;

  return Object.keys(problems).length === 0
    ? { valid: true, details }
    : { valid: false, form: { ...details, errors: problems } };
}

/** Validates a registration submission. `notes` is carried as accessibility notes. */
export function checkRegistrationDetails(submitted) {
  const result = checkDetails(submitted ?? {}, "accessibilityNotes");
  if (!result.valid) return result;
  return {
    valid: true,
    details: {
      name: result.details.name,
      email: result.details.email,
      notes: result.details.accessibilityNotes ?? null
    }
  };
}

/** Validates a waitlist submission. */
export function checkWaitlistDetails(submitted) {
  const result = checkDetails(submitted ?? {}, "notes");
  if (!result.valid) return result;
  return {
    valid: true,
    details: {
      name: result.details.name,
      email: result.details.email,
      notes: result.details.notes ?? null
    }
  };
}
