import type { ReactNode } from "react";
import styles from "./StatusWithAction.module.css";

export interface StatusWithActionProps {
  statusContent: ReactNode;
  statusAction: ReactNode;
}

export function StatusWithAction({ statusContent, statusAction }: StatusWithActionProps) {
  return (
    <section className={styles.root}>
      <div className={styles.content}>{statusContent}</div>
      <footer className={styles.action}>{statusAction}</footer>
    </section>
  );
}
