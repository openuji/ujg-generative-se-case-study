import styles from "./DetailList.module.css";

export interface DetailListEntry {
  term: string;
  value: string;
}

export interface DetailListProps {
  entries: readonly DetailListEntry[];
}

export function DetailList({ entries }: DetailListProps) {
  return (
    <dl className={styles.list}>
      {entries.map((entry) => (
        <div className={styles.row} key={entry.term}>
          <dt className={styles.term}>{entry.term}</dt>
          <dd className={styles.value}>{entry.value}</dd>
        </div>
      ))}
    </dl>
  );
}
