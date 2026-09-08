import type { ReactNode } from "react";
import styles from "./OfferedPlaceResponse.module.css";

export interface OfferedPlaceResponseProps {
  offerSummary: ReactNode;
  offerAcceptAction: ReactNode;
  offerDeclineAction: ReactNode;
}

export function OfferedPlaceResponse({
  offerSummary,
  offerAcceptAction,
  offerDeclineAction
}: OfferedPlaceResponseProps) {
  return (
    <section className={styles.root}>
      <div className={styles.summary}>{offerSummary}</div>
      <footer className={styles.actions}>
        {offerAcceptAction}
        {offerDeclineAction}
      </footer>
    </section>
  );
}
