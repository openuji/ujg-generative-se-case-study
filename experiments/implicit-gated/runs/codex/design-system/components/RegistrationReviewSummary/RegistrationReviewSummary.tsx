import type { RegistrationReviewData } from "../../src/types";
import styles from "./RegistrationReviewSummary.module.css";

export function RegistrationReviewSummary({ workshopTitle, name, email }: RegistrationReviewData) {
  return (
    <section className={styles.review}>
      <h2>Your information</h2>
      <dl>
        <div><dt>Workshop</dt><dd>{workshopTitle}</dd></div>
        <div><dt>Full name</dt><dd>{name}</dd></div>
        <div><dt>Email</dt><dd>{email}</dd></div>
      </dl>
    </section>
  );
}
