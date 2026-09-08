import type { OfferSummaryData } from "../../src/types";
import { StatusGlyph } from "../../primitives/StatusGlyph/StatusGlyph";
import styles from "./OfferedPlaceEmailContent.module.css";

export function OfferedPlaceEmailContent({ title, message, workshopTitle, expiresAt }: OfferSummaryData) {
  return (
    <section className={styles.email}>
      <StatusGlyph kind="mail" />
      <h1>{title}</h1>
      <p>{message}</p>
      <div>
        <strong>{workshopTitle}</strong>
        <span>Accept by {expiresAt}</span>
      </div>
    </section>
  );
}
