import { FieldControl } from "../../primitives/FieldControl/FieldControl";
import styles from "../../primitives/shared/FormFields.module.css";

export type WaitlistFormFieldsProps = {
  email?: string;
  errors?: Partial<Record<"email" | "name" | "notes", string>>;
  name?: string;
  notes?: string;
};

export function WaitlistFormFields({
  email,
  errors = {},
  name,
  notes
}: WaitlistFormFieldsProps) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Waitlist details</legend>
      <FieldControl error={errors.name} label="Full name" name="waitlist-name" value={name} />
      <FieldControl
        error={errors.email}
        label="Email address"
        name="waitlist-email"
        type="email"
        value={email}
      />
      <FieldControl error={errors.notes} label="Notes" name="waitlist-notes" type="textarea" value={notes} />
    </fieldset>
  );
}
