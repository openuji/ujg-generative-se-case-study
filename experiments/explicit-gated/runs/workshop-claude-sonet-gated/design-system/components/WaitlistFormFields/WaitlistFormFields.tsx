import { TextControl } from "../../primitives/TextControl/TextControl";
import styles from "./WaitlistFormFields.module.css";

/** Validation metadata for the editable waitlist fields. It is never submitted. */
export interface WaitlistFormFieldErrors {
  name?: string;
  email?: string;
  notes?: string;
}

export interface WaitlistFormFieldsProps {
  name?: string;
  email?: string;
  notes?: string;
  errors?: WaitlistFormFieldErrors;
}

export function WaitlistFormFields({ name, email, notes, errors }: WaitlistFormFieldsProps) {
  return (
    <div className={styles.fields}>
      <TextControl label="Name" name="name" defaultValue={name} error={errors?.name} />
      <TextControl label="Email" name="email" defaultValue={email} error={errors?.email} />
      <TextControl label="Notes" name="notes" defaultValue={notes} error={errors?.notes} multiline />
    </div>
  );
}
