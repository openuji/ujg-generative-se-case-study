import { StatusIcon } from "../../primitives/StatusIcon/StatusIcon";
import styles from "./StatusNotice.module.css";

export type StatusNoticeTone = "error" | "info" | "success" | "warning";

export interface StatusNoticeProps {
  message: string;
  tone?: StatusNoticeTone;
}

export function StatusNotice({ message, tone }: StatusNoticeProps) {
  return (
    <p className={styles.notice} data-tone={tone} role="status">
      {tone === undefined ? undefined : <StatusIcon tone={tone} size="inline" />}
      {message}
    </p>
  );
}
