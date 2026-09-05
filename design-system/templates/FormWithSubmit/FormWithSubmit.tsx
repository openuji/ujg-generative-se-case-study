import type { ReactNode } from "react";
import { Panel } from "../../primitives/Panel/Panel";
import styles from "./FormWithSubmit.module.css";

export type FormWithSubmitProps = {
  fields: ReactNode;
  submitAction: ReactNode;
};

export function FormWithSubmit({ fields, submitAction }: FormWithSubmitProps) {
  return (
    <Panel>
      <form className={styles.form}>
        {fields}
        <div className={styles.actions}>{submitAction}</div>
      </form>
    </Panel>
  );
}
