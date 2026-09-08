import styles from "./RegistrationReviewSummary.module.css";

export interface RegistrationReviewSummaryProps {
  workshopTitle: string;
  name: string;
  email: string;
}

export function RegistrationReviewSummary({
  workshopTitle,
  name,
  email
}: RegistrationReviewSummaryProps) {
  return (
    <section className={styles.root} aria-labelledby="registration-review-title">
      <h1 className={styles.title} id="registration-review-title">Review registration</h1>
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
