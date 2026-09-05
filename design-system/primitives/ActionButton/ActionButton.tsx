import type { MouseEventHandler, ReactNode } from "react";
import { IconSymbol } from "../IconSymbol/IconSymbol";
import styles from "./ActionButton.module.css";

export type ActionButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  variant?: "primary" | "secondary";
  type?: "button" | "submit";
};

export function ActionButton({
  children,
  disabled = false,
  href,
  onClick,
  variant = "primary",
  type = "button"
}: ActionButtonProps) {
  const className = `${styles.button} ${styles[variant]}`;
  const content = (
    <>
      <span>{children}</span>
      <IconSymbol className={styles.icon} name="arrow-right" />
    </>
  );

  if (href) {
    return (
      <a aria-disabled={disabled} className={className} href={disabled ? undefined : href} onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button className={className} disabled={disabled} onClick={onClick} type={type}>
      {content}
    </button>
  );
}
