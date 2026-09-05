import type { ElementType, ReactNode } from "react";
import styles from "./Panel.module.css";

export type PanelProps = {
  actions?: ReactNode;
  as?: ElementType;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  title?: string;
};

export function Panel({ actions, as: Tag = "section", children, className, icon, title }: PanelProps) {
  const rootClassName = [styles.root, className].filter(Boolean).join(" ");

  return (
    <Tag className={rootClassName}>
      {title || icon ? (
        <header className={styles.header}>
          {icon ? <div className={styles.iconWell}>{icon}</div> : null}
          {title ? <h2 className={styles.title}>{title}</h2> : null}
        </header>
      ) : null}
      <div className={styles.body}>{children}</div>
      {actions ? <footer className={styles.actions}>{actions}</footer> : null}
    </Tag>
  );
}
