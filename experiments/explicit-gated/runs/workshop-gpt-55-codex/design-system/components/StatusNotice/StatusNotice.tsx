import styles from "./StatusNotice.module.css";

type Tone = "error" | "info" | "success" | "warning";

export interface StatusNoticeProps {
  message: string;
  tone?: Tone;
}

export function StatusNotice({ message, tone = "info" }: StatusNoticeProps) {
  const toneClass = styles[tone] ?? styles.info;

  return (
    <aside className={`${styles.root} ${toneClass}`} role={tone === "error" ? "alert" : "status"} data-tone={tone}>
      {message}
    </aside>
  );
}
