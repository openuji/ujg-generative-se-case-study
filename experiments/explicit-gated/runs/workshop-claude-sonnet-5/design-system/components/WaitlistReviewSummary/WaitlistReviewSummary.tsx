import { DetailList } from "../../primitives/DetailList/DetailList";
import styles from "./WaitlistReviewSummary.module.css";

export interface WaitlistReviewSummaryProps {
  workshopTitle: string;
  name: string;
  email: string;
}

export function WaitlistReviewSummary({ workshopTitle, name, email }: WaitlistReviewSummaryProps) {
  return (
    <div className={styles.summary}>
      <h2 className={styles.title}>{workshopTitle}</h2>
      <DetailList
        entries={[
          { term: "Name", value: name },
          { term: "Email", value: email }
        ]}
      />
    </div>
  );
}
