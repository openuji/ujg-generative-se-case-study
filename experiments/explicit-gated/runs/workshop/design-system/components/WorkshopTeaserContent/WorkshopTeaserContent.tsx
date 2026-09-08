import styles from "./WorkshopTeaserContent.module.css";

export interface WorkshopTeaserContentProps {
  title: string;
  summary: string;
  date: string;
  location: string;
}

export function WorkshopTeaserContent({
  title,
  summary,
  date,
  location
}: WorkshopTeaserContentProps) {
  return (
    <article className={styles.root}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.summary}>{summary}</p>
      <dl className={styles.metadata}>
        <div className={styles.metaRow}>
          <dt>Date</dt>
          <dd>{date}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt>Location</dt>
          <dd>{location}</dd>
        </div>
      </dl>
    </article>
  );
}
