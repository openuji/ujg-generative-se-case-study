import type { ReactNode } from "react";
import styles from "./DetailWithNotice.module.css";

type DetailWithNoticeProps = {
  detailSummary: ReactNode;
  detailNotice: ReactNode;
};

export function DetailWithNotice({ detailSummary, detailNotice }: DetailWithNoticeProps) {
  return (
    <section className={styles.detail}>
      <div>{detailSummary}</div>
      <aside>{detailNotice}</aside>
    </section>
  );
}
