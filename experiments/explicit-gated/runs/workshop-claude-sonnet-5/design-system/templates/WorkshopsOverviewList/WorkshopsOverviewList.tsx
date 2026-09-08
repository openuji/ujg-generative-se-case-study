import type { ReactNode } from "react";
import styles from "./WorkshopsOverviewList.module.css";

export interface WorkshopsOverviewListProps {
  /**
   * Slot content for the overview. The caller passes one entry per realized
   * workshop; the template never produces the repetition itself.
   */
  workshops: readonly ReactNode[];
}

export function WorkshopsOverviewList({ workshops }: WorkshopsOverviewListProps) {
  return (
    <ul className={styles.list}>
      {workshops.map((workshop, index) => (
        <li className={styles.entry} key={index}>
          {workshop}
        </li>
      ))}
    </ul>
  );
}
