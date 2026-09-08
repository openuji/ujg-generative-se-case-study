import styles from "./OfferResponseSummary.module.css";

export interface OfferResponseSummaryProps {
  title: string;
  message: string;
  workshopTitle: string;
  expiresAt: string;
}

export function OfferResponseSummary({
  title,
  message,
  workshopTitle,
  expiresAt
}: OfferResponseSummaryProps) {
  return (
    <section className={styles.root} aria-labelledby="offer-response-summary-title">
      <h1 className={styles.title} id="offer-response-summary-title">{title}</h1>
      <p className={styles.message}>{message}</p>
      <dl className={styles.list}>
        <div className={styles.row}>
          <dt>Workshop</dt>
          <dd>{workshopTitle}</dd>
        </div>
        <div className={styles.row}>
          <dt>Respond by</dt>
          <dd>{expiresAt}</dd>
        </div>
      </dl>
    </section>
  );
}
