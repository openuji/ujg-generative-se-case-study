import type { ReactNode } from "react";
import styles from "./OfferedPlaceResponse.module.css";

type OfferedPlaceResponseProps = {
  offerSummary: ReactNode;
  offerAcceptAction: ReactNode;
  offerDeclineAction: ReactNode;
};

export function OfferedPlaceResponse({ offerSummary, offerAcceptAction, offerDeclineAction }: OfferedPlaceResponseProps) {
  return (
    <section className={styles.response}>
      {offerSummary}
      <div className={styles.actions}>
        {offerAcceptAction}
        {offerDeclineAction}
      </div>
    </section>
  );
}
