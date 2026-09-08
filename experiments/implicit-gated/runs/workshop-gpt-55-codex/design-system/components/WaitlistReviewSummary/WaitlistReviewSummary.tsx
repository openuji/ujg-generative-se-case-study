import type { WaitlistReviewData } from "../../src/types";
import styles from "./WaitlistReviewSummary.module.css";

export function WaitlistReviewSummary({ workshopTitle, name, email }: WaitlistReviewData) {
  return (
    <section className={styles.review}>
      <h2>Waitlist information</h2>
      <dl>
        <div><dt>Workshop</dt><dd>{workshopTitle}</dd></div>
        <div><dt>Full name</dt><dd>{name}</dd></div>
        <div><dt>Email</dt><dd>{email}</dd></div>
      </dl>
    </section>
  );
}
