import type { ReactNode } from "react";
import styles from "./DetailWithAction.module.css";

export interface DetailWithActionProps {
  detailSummary: ReactNode;
  detailAction: ReactNode;
}

export function DetailWithAction({ detailSummary, detailAction }: DetailWithActionProps) {
  return (
    <section className={styles.root}>
      <div className={styles.summary}>{detailSummary}</div>
      <footer className={styles.action}>{detailAction}</footer>
    </section>
  );
}
