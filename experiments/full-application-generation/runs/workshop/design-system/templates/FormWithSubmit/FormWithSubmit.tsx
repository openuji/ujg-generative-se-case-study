import type { FormEvent, ReactNode } from "react";
import styles from "./FormWithSubmit.module.css";

export interface FormWithSubmitProps {
  formFields: ReactNode;
  formSubmitAction: ReactNode;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
}

export function FormWithSubmit({ formFields, formSubmitAction, onSubmit }: FormWithSubmitProps) {
  return (
    <form className={styles.root} aria-label="Details" onSubmit={onSubmit}>
      <div className={styles.fields}>{formFields}</div>
      <footer className={styles.action}>{formSubmitAction}</footer>
    </form>
  );
}
