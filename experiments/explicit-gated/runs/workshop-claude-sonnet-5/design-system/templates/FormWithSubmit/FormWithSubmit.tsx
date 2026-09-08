import type { FormEventHandler, ReactNode } from "react";
import styles from "./FormWithSubmit.module.css";

export interface FormWithSubmitProps {
  fields: ReactNode;
  submitAction: ReactNode;
  /** Accessible name for the form region. */
  label?: string;
  onSubmit?: FormEventHandler<HTMLFormElement>;
}

export function FormWithSubmit({ fields, submitAction, label, onSubmit }: FormWithSubmitProps) {
  return (
    <form className={styles.form} aria-label={label} onSubmit={onSubmit}>
      {fields}
      <footer className={styles.footer}>{submitAction}</footer>
    </form>
  );
}
