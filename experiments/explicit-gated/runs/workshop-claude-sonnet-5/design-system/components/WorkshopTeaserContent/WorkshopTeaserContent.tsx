import { DetailList } from "../../primitives/DetailList/DetailList";
import styles from "./WorkshopTeaserContent.module.css";

export interface WorkshopTeaserContentProps {
  title: string;
  summary: string;
  date: string;
  location: string;
}

export function WorkshopTeaserContent({ title, summary, date, location }: WorkshopTeaserContentProps) {
  return (
    <div className={styles.content}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.summary}>{summary}</p>
      <div className={styles.facts}>
        <DetailList
          entries={[
            { term: "Date", value: date },
            { term: "Location", value: location }
          ]}
        />
      </div>
    </div>
  );
}
