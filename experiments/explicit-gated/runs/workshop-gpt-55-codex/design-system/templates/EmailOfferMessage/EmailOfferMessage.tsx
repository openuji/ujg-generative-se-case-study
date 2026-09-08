import type { ReactNode } from "react";
import styles from "./EmailOfferMessage.module.css";

export interface EmailOfferMessageProps {
  emailBody: ReactNode;
  emailLinkAction: ReactNode;
}

export function EmailOfferMessage({ emailBody, emailLinkAction }: EmailOfferMessageProps) {
  return (
    <article className={styles.root}>
      <div className={styles.body}>{emailBody}</div>
      <footer className={styles.action}>{emailLinkAction}</footer>
    </article>
  );
}
