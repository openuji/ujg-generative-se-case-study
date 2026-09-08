import type { ReactNode } from "react";
import styles from "./DetailWithAction.module.css";

type DetailWithActionProps = {
  detailSummary: ReactNode;
  detailAction: ReactNode;
};

export function DetailWithAction({ detailSummary, detailAction }: DetailWithActionProps) {
  return (
    <section className={styles.detail}>
      <div className={styles.summary}>{detailSummary}</div>
      <aside className={styles.panel}>{detailAction}</aside>
    </section>
  );
}
