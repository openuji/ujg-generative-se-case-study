import type { EmailLinkControlProps } from "../../src/types";
import styles from "./EmailLinkControl.module.css";

export function EmailLinkControl({ label, href, onFollow }: EmailLinkControlProps) {
  return (
    <a className={styles.link} href={href} onClick={onFollow}>
      <span>{label}</span>
      <span aria-hidden="true">→</span>
    </a>
  );
}
