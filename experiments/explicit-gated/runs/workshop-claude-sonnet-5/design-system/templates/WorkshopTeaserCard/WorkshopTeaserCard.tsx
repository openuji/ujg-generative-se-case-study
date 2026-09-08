import type { ReactNode } from "react";
import styles from "./WorkshopTeaserCard.module.css";

export interface WorkshopTeaserCardProps {
  content: ReactNode;
  action: ReactNode;
}

export function WorkshopTeaserCard({ content, action }: WorkshopTeaserCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.body}>{content}</div>
      <footer className={styles.footer}>{action}</footer>
    </article>
  );
}
