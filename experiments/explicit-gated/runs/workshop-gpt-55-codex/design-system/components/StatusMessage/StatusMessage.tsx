import styles from "./StatusMessage.module.css";

export type Tone = "error" | "info" | "success" | "warning";

export interface StatusMessageDetail {
  term: string;
  value: string;
}

export interface StatusMessageProps {
  title: string;
  message: string;
  tone?: Tone;
  details?: StatusMessageDetail[];
}

export function StatusMessage({
  title,
  message,
  tone = "info",
  details = []
}: StatusMessageProps) {
  const toneClass = styles[tone] ?? styles.info;

  return (
    <section className={`${styles.root} ${toneClass}`} aria-live={tone === "error" ? "assertive" : "polite"} data-tone={tone}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.message}>{message}</p>
      {details.length > 0 ? (
        <dl className={styles.details}>
          {details.map((detail) => (
            <div className={styles.row} key={`${detail.term}:${detail.value}`}>
              <dt>{detail.term}</dt>
              <dd>{detail.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
