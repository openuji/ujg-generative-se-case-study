import type { ReactNode } from "react";
import styles from "./EmailOfferMessage.module.css";

export interface EmailOfferMessageProps {
  body: ReactNode;
  linkAction: ReactNode;
}

export function EmailOfferMessage({ body, linkAction }: EmailOfferMessageProps) {
  return (
    <section className={styles.message}>
      {body}
      <footer className={styles.footer}>{linkAction}</footer>
    </section>
  );
}
