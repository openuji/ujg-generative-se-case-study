import { Field } from "../../primitives/Field/Field";
import type { RegistrationFormData } from "../../src/types";
import styles from "./RegistrationFormFields.module.css";

export function RegistrationFormFields({ name = "", email = "", accessibilityNotes = "", errors = {} }: RegistrationFormData) {
  return (
    <div className={styles.fields}>
      <Field label="Full name" name="name" error={errors.name}>
        <input id="name" name="name" defaultValue={name} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} />
      </Field>
      <Field label="Email" name="email" error={errors.email}>
        <input id="email" name="email" type="email" defaultValue={email} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} />
      </Field>
      <Field label="Accessibility notes" name="accessibilityNotes" error={errors.accessibilityNotes}>
        <textarea id="accessibilityNotes" name="accessibilityNotes" defaultValue={accessibilityNotes} aria-invalid={Boolean(errors.accessibilityNotes)} aria-describedby={errors.accessibilityNotes ? "accessibilityNotes-error" : undefined} />
      </Field>
    </div>
  );
}
