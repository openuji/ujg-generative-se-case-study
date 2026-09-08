import type { StatusNoticeData } from "../../src/types";
import styles from "./StatusNotice.module.css";

export function StatusNotice({ message, tone = "info" }: StatusNoticeData) {
  return (
    <aside className={styles.notice} data-tone={tone}>
      <span aria-hidden="true" />
      <p>{message}</p>
    </aside>
  );
}
