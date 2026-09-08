import type { ReactNode } from "react";
import styles from "./ReviewWithActions.module.css";

export interface ReviewWithActionsProps {
  reviewSummary: ReactNode;
  reviewEditAction: ReactNode;
  reviewSubmitAction: ReactNode;
}

export function ReviewWithActions({
  reviewSummary,
  reviewEditAction,
  reviewSubmitAction
}: ReviewWithActionsProps) {
  return (
    <section className={styles.root}>
      <div className={styles.summary}>{reviewSummary}</div>
      <footer className={styles.actions}>
        {reviewEditAction}
        {reviewSubmitAction}
      </footer>
    </section>
  );
}
