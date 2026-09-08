import { DetailList } from "../../primitives/DetailList/DetailList";
import styles from "./RegistrationReviewSummary.module.css";

export interface RegistrationReviewSummaryProps {
  workshopTitle: string;
  name: string;
  email: string;
}

export function RegistrationReviewSummary({ workshopTitle, name, email }: RegistrationReviewSummaryProps) {
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
