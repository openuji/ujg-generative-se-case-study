import type { ReactNode } from "react";
import styles from "./ReviewWithActions.module.css";

export interface ReviewWithActionsProps {
  summary: ReactNode;
  editAction: ReactNode;
  submitAction: ReactNode;
}

export function ReviewWithActions({ summary, editAction, submitAction }: ReviewWithActionsProps) {
  return (
    <section className={styles.review}>
      <div className={styles.body}>{summary}</div>
      <footer className={styles.footer}>
        {editAction}
        {submitAction}
      </footer>
    </section>
  );
}
