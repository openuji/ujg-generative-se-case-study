import { DetailList } from "../../primitives/DetailList/DetailList";
import styles from "./OfferResponseSummary.module.css";

export interface OfferResponseSummaryProps {
  title: string;
  message: string;
  workshopTitle: string;
  expiresAt: string;
}

export function OfferResponseSummary({ title, message, workshopTitle, expiresAt }: OfferResponseSummaryProps) {
  return (
    <div className={styles.summary}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.body}>{message}</p>
      <div className={styles.facts}>
        <DetailList
          entries={[
            { term: "Workshop", value: workshopTitle },
            { term: "Offer expires", value: expiresAt }
          ]}
        />
      </div>
    </div>
  );
}
