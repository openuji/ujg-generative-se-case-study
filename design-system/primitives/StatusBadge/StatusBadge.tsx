import type { ReactNode } from "react";
import styles from "./StatusBadge.module.css";

export type StatusBadgeTone = "error" | "info" | "success" | "warning";

export type StatusBadgeProps = {
  children: ReactNode;
  showDot?: boolean;
  tone?: StatusBadgeTone;
};

export function StatusBadge({ children, showDot = true, tone = "info" }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      {showDot ? <span className={styles.dot} /> : null}
      {children}
    </span>
  );
}
