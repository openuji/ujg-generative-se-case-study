import { Field } from "../../primitives/Field/Field";
import type { WaitlistFormData } from "../../src/types";
import styles from "./WaitlistFormFields.module.css";

export function WaitlistFormFields({ name = "", email = "", notes = "", errors = {} }: WaitlistFormData) {
  return (
    <div className={styles.fields}>
      <Field label="Full name" name="name" error={errors.name}>
        <input id="name" name="name" defaultValue={name} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} />
      </Field>
      <Field label="Email" name="email" error={errors.email}>
        <input id="email" name="email" type="email" defaultValue={email} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} />
      </Field>
      <Field label="Notes" name="notes" error={errors.notes}>
        <textarea id="notes" name="notes" defaultValue={notes} aria-invalid={Boolean(errors.notes)} aria-describedby={errors.notes ? "notes-error" : undefined} />
      </Field>
    </div>
  );
}
