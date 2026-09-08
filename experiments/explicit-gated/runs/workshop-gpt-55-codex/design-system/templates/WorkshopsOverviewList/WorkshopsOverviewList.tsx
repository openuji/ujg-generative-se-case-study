import type { ReactNode } from "react";
import styles from "./WorkshopsOverviewList.module.css";

export interface WorkshopsOverviewListProps {
  overviewWorkshops: ReactNode;
}

export function WorkshopsOverviewList({ overviewWorkshops }: WorkshopsOverviewListProps) {
  return (
    <section className={styles.root} aria-label="Workshops">
      {overviewWorkshops}
    </section>
  );
}
