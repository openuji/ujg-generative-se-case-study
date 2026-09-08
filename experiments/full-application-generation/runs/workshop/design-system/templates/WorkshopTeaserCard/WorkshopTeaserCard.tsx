import type { ReactNode } from "react";
import styles from "./WorkshopTeaserCard.module.css";

export interface WorkshopTeaserCardProps {
  teaserContent: ReactNode;
  teaserAction: ReactNode;
}

export function WorkshopTeaserCard({ teaserContent, teaserAction }: WorkshopTeaserCardProps) {
  return (
    <article className={styles.root}>
      <div className={styles.content}>{teaserContent}</div>
      <footer className={styles.action}>{teaserAction}</footer>
    </article>
  );
}
