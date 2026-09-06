import type { MouseEventHandler } from "react";
import { ActionButton } from "../../primitives/ActionButton/ActionButton";
import styles from "./ActionControl.module.css";

export type ActionControlProps = {
  disabled?: boolean;
  label: string;
  onAction?: MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit";
  variant?: "primary" | "secondary";
};

export function ActionControl({
  disabled = false,
  label,
  onAction,
  type = "button",
  variant = "primary"
}: ActionControlProps) {
  return (
    <span className={styles.root}>
      <ActionButton disabled={disabled} onClick={onAction} type={type} variant={variant}>
        {label}
      </ActionButton>
    </span>
  );
}
