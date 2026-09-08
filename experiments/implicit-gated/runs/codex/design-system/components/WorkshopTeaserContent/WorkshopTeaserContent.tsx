import type { WorkshopTeaserData } from "../../src/types";
import { StatusGlyph } from "../../primitives/StatusGlyph/StatusGlyph";
import styles from "./WorkshopTeaserContent.module.css";

export function WorkshopTeaserContent({ title, summary, date, location }: WorkshopTeaserData) {
  return (
    <article className={styles.content}>
      <StatusGlyph kind={title.toLowerCase().includes("living") ? "leaf" : "bars"} />
      <div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.meta}>{date} • {location}</p>
        <p className={styles.summary}>{summary}</p>
      </div>
    </article>
  );
}
