import styles from "./WaitlistReviewSummary.module.css";

export interface WaitlistReviewSummaryProps {
  workshopTitle: string;
  name: string;
  email: string;
}

export function WaitlistReviewSummary({
  workshopTitle,
  name,
  email
}: WaitlistReviewSummaryProps) {
  return (
    <section className={styles.root} aria-labelledby="waitlist-review-title">
      <h1 className={styles.title} id="waitlist-review-title">Review waitlist request</h1>
      <dl className={styles.list}>
        <div className={styles.row}>
          <dt>Workshop</dt>
          <dd>{workshopTitle}</dd>
        </div>
        <div className={styles.row}>
          <dt>Name</dt>
          <dd>{name}</dd>
        </div>
        <div className={styles.row}>
          <dt>Email</dt>
          <dd>{email}</dd>
        </div>
      </dl>
    </section>
  );
}
