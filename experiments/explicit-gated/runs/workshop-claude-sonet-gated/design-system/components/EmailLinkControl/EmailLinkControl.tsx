import styles from "./EmailLinkControl.module.css";

/**
 * Generic affordance for a command reached through an email link. One control
 * serves every such command; the calling context supplies the label and target.
 */
export interface EmailLinkControlProps {
  label: string;
  href: string;
}

export function EmailLinkControl({ label, href }: EmailLinkControlProps) {
  return (
    <a className={styles.link} href={href}>
      {label}
    </a>
  );
}
