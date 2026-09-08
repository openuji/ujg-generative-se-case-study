import type { WorkshopDetailData } from "../../src/types";
import { StatusGlyph } from "../../primitives/StatusGlyph/StatusGlyph";
import styles from "./WorkshopDetailSummary.module.css";

export function WorkshopDetailSummary({ title, description, date, location, availability }: WorkshopDetailData) {
  return (
    <section className={styles.summary}>
      <StatusGlyph kind="bars" />
      <div>
        <h2>{title}</h2>
        <p className={styles.meta}>{date} • {location}</p>
        <p>{description}</p>
        <span className={styles.badge}>{availability}</span>
      </div>
    </section>
  );
}
