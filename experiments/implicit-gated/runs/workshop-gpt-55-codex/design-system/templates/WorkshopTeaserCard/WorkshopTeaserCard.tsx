import type { ReactNode } from "react";
import styles from "./WorkshopTeaserCard.module.css";

type WorkshopTeaserCardProps = {
  teaserContent: ReactNode;
  teaserAction: ReactNode;
};

export function WorkshopTeaserCard({ teaserContent, teaserAction }: WorkshopTeaserCardProps) {
  return (
    <article className={styles.card}>
      <div>{teaserContent}</div>
      <div className={styles.action}>{teaserAction}</div>
    </article>
  );
}
