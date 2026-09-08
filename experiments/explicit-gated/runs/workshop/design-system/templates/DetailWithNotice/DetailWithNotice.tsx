import type { ReactNode } from "react";
import styles from "./DetailWithNotice.module.css";

export interface DetailWithNoticeProps {
  detailSummary: ReactNode;
  detailNotice: ReactNode;
}

export function DetailWithNotice({ detailSummary, detailNotice }: DetailWithNoticeProps) {
  return (
    <section className={styles.root}>
      <div className={styles.summary}>{detailSummary}</div>
      <div className={styles.notice}>{detailNotice}</div>
    </section>
  );
}
