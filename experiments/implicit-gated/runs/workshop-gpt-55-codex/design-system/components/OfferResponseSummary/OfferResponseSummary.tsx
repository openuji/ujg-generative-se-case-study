import type { OfferSummaryData } from "../../src/types";
import { StatusGlyph } from "../../primitives/StatusGlyph/StatusGlyph";
import styles from "./OfferResponseSummary.module.css";

export function OfferResponseSummary({ title, message, workshopTitle, expiresAt }: OfferSummaryData) {
  return (
    <section className={styles.offer}>
      <StatusGlyph kind="bars" />
      <h1>{title}</h1>
      <p>{message}</p>
      <p className={styles.expires}>Accept by {expiresAt}</p>
      <strong>{workshopTitle}</strong>
    </section>
  );
}
