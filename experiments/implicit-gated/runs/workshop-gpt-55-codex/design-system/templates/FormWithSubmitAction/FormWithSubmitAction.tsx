import type { FormTemplateProps } from "../../src/types";
import styles from "./FormWithSubmitAction.module.css";

export function FormWithSubmitAction({ formFields, formSubmitAction, onSubmit }: FormTemplateProps) {
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.fields}>{formFields}</div>
      <div className={styles.actions}>{formSubmitAction}</div>
    </form>
  );
}
