import type { ReactNode } from "react";
import { IconSymbol, type IconSymbolName } from "../IconSymbol/IconSymbol";
import styles from "./DescriptionList.module.css";

export type DescriptionTerm = {
  icon?: IconSymbolName;
  term: string;
  value: ReactNode;
};

export type DescriptionListProps = {
  terms: DescriptionTerm[];
};

export function DescriptionList({ terms }: DescriptionListProps) {
  return (
    <dl className={styles.list}>
      {terms.map((item) => (
        <div className={styles.item} key={item.term}>
          <dt className={styles.term}>
            {item.icon ? <IconSymbol className={styles.icon} name={item.icon} /> : null}
            {item.term}
          </dt>
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
