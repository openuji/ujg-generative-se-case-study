import type { ReactNode } from "react";
import styles from "./EmailOfferMessage.module.css";

type EmailOfferMessageProps = {
  emailBody: ReactNode;
  emailLinkAction: ReactNode;
};

export function EmailOfferMessage({ emailBody, emailLinkAction }: EmailOfferMessageProps) {
  return (
    <article className={styles.message}>
      <div>{emailBody}</div>
      <div>{emailLinkAction}</div>
    </article>
  );
}
