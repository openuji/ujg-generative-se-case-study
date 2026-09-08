import type { ReactNode } from "react";
import styles from "./OfferedPlaceResponse.module.css";

export interface OfferedPlaceResponseProps {
  summary: ReactNode;
  acceptAction: ReactNode;
  declineAction: ReactNode;
}

export function OfferedPlaceResponse({ summary, acceptAction, declineAction }: OfferedPlaceResponseProps) {
  return (
    <section className={styles.offer}>
      {summary}
      <footer className={styles.footer}>
        {acceptAction}
        {declineAction}
      </footer>
    </section>
  );
}
