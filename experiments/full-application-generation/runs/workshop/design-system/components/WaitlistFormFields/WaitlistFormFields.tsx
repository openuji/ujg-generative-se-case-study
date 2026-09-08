import styles from "./WaitlistFormFields.module.css";

export interface WaitlistFormErrors {
  name?: string;
  email?: string;
  notes?: string;
}

export interface WaitlistFormFieldsProps {
  name?: string;
  email?: string;
  notes?: string;
  errors?: WaitlistFormErrors;
}

export function WaitlistFormFields({
  name = "",
  email = "",
  notes = "",
  errors = {}
}: WaitlistFormFieldsProps) {
  return (
    <fieldset className={styles.root}>
      <legend className={styles.legend}>Waitlist details</legend>
      <label className={styles.field}>
        <span>Full name</span>
        <input
          className={styles.control}
          name="name"
          type="text"
          defaultValue={name}
          aria-invalid={errors.name ? "true" : undefined}
        />
      </label>
      {errors.name ? <p className={styles.error} role="alert">{errors.name}</p> : null}
      <label className={styles.field}>
        <span>Email</span>
        <input
          className={styles.control}
          name="email"
          type="email"
          defaultValue={email}
          aria-invalid={errors.email ? "true" : undefined}
        />
      </label>
      {errors.email ? <p className={styles.error} role="alert">{errors.email}</p> : null}
      <label className={styles.field}>
        <span>Notes</span>
        <textarea className={styles.textarea} name="notes" defaultValue={notes} aria-invalid={errors.notes ? "true" : undefined} />
      </label>
      {errors.notes ? <p className={styles.error} role="alert">{errors.notes}</p> : null}
    </fieldset>
  );
}
