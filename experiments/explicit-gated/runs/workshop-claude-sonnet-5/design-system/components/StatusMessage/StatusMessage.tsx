import { DetailList } from "../../primitives/DetailList/DetailList";
import { StatusIcon } from "../../primitives/StatusIcon/StatusIcon";
import styles from "./StatusMessage.module.css";

export type StatusTone = "error" | "info" | "success" | "warning";

export interface StatusMessageDetail {
  term: string;
  value: string;
}

export interface StatusMessageProps {
  title: string;
  message: string;
  tone?: StatusTone;
  details?: readonly StatusMessageDetail[];
}

export function StatusMessage({ title, message, tone, details }: StatusMessageProps) {
  const hasDetails = details !== undefined && details.length > 0;

  return (
    <div className={styles.message} data-tone={tone}>
      {tone === undefined ? undefined : <StatusIcon tone={tone} />}
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.body}>{message}</p>
      {hasDetails ? (
        <div className={styles.details}>
          <DetailList entries={details} />
        </div>
      ) : undefined}
    </div>
  );
}
