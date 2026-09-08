import styles from "./WorkshopDetailSummary.module.css";

export interface WorkshopDetailSummaryProps {
  title: string;
  description: string;
  date: string;
  location: string;
  availability: string;
}

export function WorkshopDetailSummary({
  title,
  description,
  date,
  location,
  availability
}: WorkshopDetailSummaryProps) {
  return (
    <section className={styles.root} aria-labelledby="workshop-detail-title">
      <h1 className={styles.title} id="workshop-detail-title">{title}</h1>
      <p className={styles.description}>{description}</p>
      <dl className={styles.list}>
        <div className={styles.row}>
          <dt>Date</dt>
          <dd>{date}</dd>
        </div>
        <div className={styles.row}>
          <dt>Location</dt>
          <dd>{location}</dd>
        </div>
        <div className={styles.row}>
          <dt>Availability</dt>
          <dd>{availability}</dd>
        </div>
      </dl>
    </section>
  );
}
