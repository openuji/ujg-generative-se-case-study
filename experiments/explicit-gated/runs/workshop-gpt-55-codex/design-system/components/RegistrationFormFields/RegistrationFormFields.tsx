import styles from "./RegistrationFormFields.module.css";

export interface RegistrationFormErrors {
  name?: string;
  email?: string;
  accessibilityNotes?: string;
}

export interface RegistrationFormFieldsProps {
  name?: string;
  email?: string;
  accessibilityNotes?: string;
  errors?: RegistrationFormErrors;
}

export function RegistrationFormFields({
  name = "",
  email = "",
  accessibilityNotes = "",
  errors = {}
}: RegistrationFormFieldsProps) {
  return (
    <fieldset className={styles.root}>
      <legend className={styles.legend}>Registration details</legend>
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
        <span>Accessibility notes</span>
        <textarea
          className={styles.textarea}
          name="accessibilityNotes"
          defaultValue={accessibilityNotes}
          aria-invalid={errors.accessibilityNotes ? "true" : undefined}
        />
      </label>
      {errors.accessibilityNotes ? <p className={styles.error} role="alert">{errors.accessibilityNotes}</p> : null}
    </fieldset>
  );
}
