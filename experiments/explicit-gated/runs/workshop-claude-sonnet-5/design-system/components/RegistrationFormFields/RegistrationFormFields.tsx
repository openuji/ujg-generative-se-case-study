import { TextControl } from "../../primitives/TextControl/TextControl";
import styles from "./RegistrationFormFields.module.css";

/** Validation metadata for the editable registration fields. It is never submitted. */
export interface RegistrationFormFieldErrors {
  name?: string;
  email?: string;
  accessibilityNotes?: string;
}

export interface RegistrationFormFieldsProps {
  name?: string;
  email?: string;
  accessibilityNotes?: string;
  errors?: RegistrationFormFieldErrors;
}

export function RegistrationFormFields({
  name,
  email,
  accessibilityNotes,
  errors
}: RegistrationFormFieldsProps) {
  return (
    <div className={styles.fields}>
      <TextControl label="Name" name="name" defaultValue={name} error={errors?.name} />
      <TextControl label="Email" name="email" defaultValue={email} error={errors?.email} />
      <TextControl
        label="Accessibility notes"
        name="accessibilityNotes"
        defaultValue={accessibilityNotes}
        error={errors?.accessibilityNotes}
        multiline
      />
    </div>
  );
}
