import type { ReactNode } from "react";
import styles from "./StatusWithAction.module.css";

export interface StatusWithActionProps {
  content: ReactNode;
  action: ReactNode;
}

export function StatusWithAction({ content, action }: StatusWithActionProps) {
  return (
    <section className={styles.status}>
      {content}
      <footer className={styles.footer}>{action}</footer>
    </section>
  );
}
