import type { ReactNode } from "react";
import styles from "./DetailWithNotice.module.css";

export interface DetailWithNoticeProps {
  summary: ReactNode;
  notice: ReactNode;
}

export function DetailWithNotice({ summary, notice }: DetailWithNoticeProps) {
  return (
    <section className={styles.detail}>
      {summary}
      <aside className={styles.notice}>{notice}</aside>
    </section>
  );
}
