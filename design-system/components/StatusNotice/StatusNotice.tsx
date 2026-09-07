import { IconSymbol, type IconSymbolName } from "../../primitives/IconSymbol/IconSymbol";
import type { StatusBadgeTone } from "../../primitives/StatusBadge/StatusBadge";
import styles from "./StatusNotice.module.css";

export type StatusNoticeProps = {
  message: string;
  tone?: StatusBadgeTone;
};

function statusIcon(tone: StatusBadgeTone): IconSymbolName {
  if (tone === "success") {
    return "check";
  }

  if (tone === "warning" || tone === "error") {
    return "warning";
  }

  return "info";
}

export function StatusNotice({ message, tone = "info" }: StatusNoticeProps) {
  return (
    <aside className={`${styles.root} ${styles[tone]}`}>
      <IconSymbol className={styles.icon} name={statusIcon(tone)} />
      <p className={styles.message}>{message}</p>
    </aside>
  );
}
