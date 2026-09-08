import styles from "./EmailLinkControl.module.css";

export interface EmailLinkControlProps {
  href: string;
  label: string;
}

export function EmailLinkControl({ href, label }: EmailLinkControlProps) {
  return <a className={styles.root} href={href}>{label}</a>;
}
