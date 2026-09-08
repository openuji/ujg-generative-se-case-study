import type { ReactNode } from "react";
import styles from "./WorkshopsOverviewList.module.css";

type WorkshopsOverviewListProps = {
  overviewWorkshops: ReactNode;
  sidebar?: ReactNode;
};

export function WorkshopsOverviewList({ overviewWorkshops, sidebar }: WorkshopsOverviewListProps) {
  return (
    <section className={styles.layout}>
      <div className={styles.list}>{overviewWorkshops}</div>
      {sidebar ? <aside className={styles.sidebar}>{sidebar}</aside> : <span className={styles.emptySidebar} aria-hidden="true" />}
    </section>
  );
}
