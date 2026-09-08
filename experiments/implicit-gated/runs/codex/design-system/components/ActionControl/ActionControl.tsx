import type { ActionControlProps } from "../../src/types";
import styles from "./ActionControl.module.css";

export function ActionControl({ label, type = "button", variant = "primary", disabled = false, onAction }: ActionControlProps) {
  return (
    <button className={styles.button} data-variant={variant} type={type} disabled={disabled} onClick={onAction}>
      <span>{label}</span>
      <span className={styles.arrow} aria-hidden="true">→</span>
    </button>
  );
}
