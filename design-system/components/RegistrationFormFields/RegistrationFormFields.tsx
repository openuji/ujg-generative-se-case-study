import { FieldControl } from "../../primitives/FieldControl/FieldControl";
import styles from "../../primitives/shared/FormFields.module.css";

export type RegistrationFormFieldsProps = {
  email?: string;
  errors?: Partial<Record<"accessibilityNotes" | "email" | "name", string>>;
  name?: string;
  accessibilityNotes?: string;
};

export function RegistrationFormFields({
  accessibilityNotes,
  email,
  errors = {},
  name
}: RegistrationFormFieldsProps) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Registration details</legend>
      <FieldControl error={errors.name} label="Full name" name="registration-name" value={name} />
      <FieldControl
        error={errors.email}
        label="Email address"
        name="registration-email"
        type="email"
        value={email}
      />
      <FieldControl
        error={errors.accessibilityNotes}
        label="Accessibility notes"
        name="registration-accessibility-notes"
        type="textarea"
        value={accessibilityNotes}
      />
    </fieldset>
  );
}
