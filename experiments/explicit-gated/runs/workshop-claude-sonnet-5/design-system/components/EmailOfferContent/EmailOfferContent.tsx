import { DetailList } from "../../primitives/DetailList/DetailList";
import styles from "./EmailOfferContent.module.css";

export interface EmailOfferContentProps {
  title: string;
  message: string;
  workshopTitle: string;
  expiresAt: string;
}

export function EmailOfferContent({ title, message, workshopTitle, expiresAt }: EmailOfferContentProps) {
  return (
    <div className={styles.content}>
      <h1 className={styles.title}>{title}</h1>
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
