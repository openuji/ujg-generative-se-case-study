import type { ReactNode } from "react";
import styles from "./ReviewWithActions.module.css";

type ReviewWithActionsProps = {
  reviewSummary: ReactNode;
  reviewEditAction: ReactNode;
  reviewSubmitAction: ReactNode;
};

export function ReviewWithActions({ reviewSummary, reviewEditAction, reviewSubmitAction }: ReviewWithActionsProps) {
  return (
    <section className={styles.review}>
      <div className={styles.summary}>{reviewSummary}</div>
      <div className={styles.actions}>
        {reviewEditAction}
        {reviewSubmitAction}
      </div>
    </section>
  );
}
