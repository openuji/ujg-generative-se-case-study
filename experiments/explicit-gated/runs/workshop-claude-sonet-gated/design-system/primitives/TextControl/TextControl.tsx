import { useId } from "react";
import styles from "./TextControl.module.css";

export interface TextControlProps {
  /** Accessible label rendered for the control. */
  label: string;
  /** Submitted field key. Callers pass the data-contract property name. */
  name: string;
  /** Initial value of the uncontrolled control. */
  defaultValue?: string;
  /** Validation message for the field, when one is present. */
  error?: string;
  /** Render a multi-line control instead of a single-line one. */
  multiline?: boolean;
}

export function TextControl({ label, name, defaultValue, error, multiline = false }: TextControlProps) {
  const controlId = useId();
  const errorId = `${controlId}-error`;
  const invalid = error !== undefined;
  const describedBy = invalid ? errorId : undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={controlId}>
        {label}
      </label>
      {multiline ? (
        <textarea
          id={controlId}
          className={`${styles.input} ${styles.multiline}`}
          name={name}
          defaultValue={defaultValue}
          aria-invalid={invalid}
          aria-describedby={describedBy}
        />
      ) : (
        <input
          id={controlId}
          className={styles.input}
          type="text"
          name={name}
          defaultValue={defaultValue}
          aria-invalid={invalid}
          aria-describedby={describedBy}
        />
      )}
      {invalid ? (
        <span className={styles.message} id={errorId} role="alert">
          {error}
        </span>
      ) : undefined}
    </div>
  );
}
