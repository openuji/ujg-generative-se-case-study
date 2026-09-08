import type { ReactNode } from "react";
import styles from "./StatusWithAction.module.css";

type StatusWithActionProps = {
  statusContent: ReactNode;
  statusAction: ReactNode;
};

export function StatusWithAction({ statusContent, statusAction }: StatusWithActionProps) {
  return (
    <section className={styles.wrap}>
      {statusContent}
      <div className={styles.action}>{statusAction}</div>
    </section>
  );
}
