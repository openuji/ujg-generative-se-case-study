import type { MouseEventHandler } from "react";
import { ActionButton } from "../../primitives/ActionButton/ActionButton";
import styles from "./EmailLinkControl.module.css";

export type EmailLinkControlProps = {
  disabled?: boolean;
  href: string;
  label: string;
  onAction?: MouseEventHandler<HTMLAnchorElement>;
  variant?: "primary" | "secondary";
};

export function EmailLinkControl({
  disabled = false,
  href,
  label,
  onAction,
  variant = "primary"
}: EmailLinkControlProps) {
  return (
    <span className={styles.root}>
      <ActionButton disabled={disabled} href={href} onClick={onAction} variant={variant}>
        {label}
      </ActionButton>
    </span>
  );
}
