import type { ReactNode } from "react";
import styles from "./DetailWithAction.module.css";

export interface DetailWithActionProps {
  summary: ReactNode;
  action: ReactNode;
}

export function DetailWithAction({ summary, action }: DetailWithActionProps) {
  return (
    <section className={styles.detail}>
      {summary}
      <footer className={styles.footer}>{action}</footer>
    </section>
  );
}
