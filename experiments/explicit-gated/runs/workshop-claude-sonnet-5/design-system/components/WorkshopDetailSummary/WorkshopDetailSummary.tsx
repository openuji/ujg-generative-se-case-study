import { DetailList } from "../../primitives/DetailList/DetailList";
import styles from "./WorkshopDetailSummary.module.css";

export interface WorkshopDetailSummaryProps {
  title: string;
  description: string;
  date: string;
  location: string;
  availability: string;
}

export function WorkshopDetailSummary({
  title,
  description,
  date,
  location,
  availability
}: WorkshopDetailSummaryProps) {
  return (
    <div className={styles.summary}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      <div className={styles.facts}>
        <DetailList
          entries={[
            { term: "Date", value: date },
            { term: "Location", value: location },
            { term: "Availability", value: availability }
          ]}
        />
      </div>
    </div>
  );
}
