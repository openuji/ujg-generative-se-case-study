import styles from "./EmailOfferContent.module.css";

export interface EmailOfferContentProps {
  title: string;
  message: string;
  workshopTitle: string;
  expiresAt: string;
}

export function EmailOfferContent({
  title,
  message,
  workshopTitle,
  expiresAt
}: EmailOfferContentProps) {
  return (
    <article className={styles.root}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.message}>{message}</p>
      <dl className={styles.list}>
        <div className={styles.row}>
          <dt>Workshop</dt>
          <dd>{workshopTitle}</dd>
        </div>
        <div className={styles.row}>
          <dt>Expires</dt>
          <dd>{expiresAt}</dd>
        </div>
      </dl>
    </article>
  );
}
