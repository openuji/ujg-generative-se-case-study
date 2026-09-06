import type { ReactNode } from "react";
import styles from "./CollectionLayout.module.css";

export type CollectionLayoutProps = {
  children: ReactNode;
  label?: string;
};

export function CollectionLayout({ children, label }: CollectionLayoutProps) {
  return (
    <section aria-label={label} className={styles.root}>
      <div className={styles.items}>{children}</div>
    </section>
  );
}
