import styles from "./ActionControl.module.css";

/**
 * Generic affordance for a command. One control serves every command; the
 * calling context supplies the label and whether the control submits a form.
 */
export interface ActionControlProps {
  label: string;
  /** `submit` submits the enclosing form; `activate` reports activation only. */
  behavior?: "activate" | "submit";
  /**
   * Presentation treatment only. The reference screens show the same command
   * affordance as a filled, an outlined, and a destructive control; this
   * selects between them without changing what the control means or does.
   */
  variant?: "primary" | "secondary" | "destructive";
  disabled?: boolean;
  onActivate?: () => void;
}

export function ActionControl({
  label,
  behavior = "activate",
  variant = "primary",
  disabled = false,
  onActivate
}: ActionControlProps) {
  return (
    <button
      type={behavior === "submit" ? "submit" : "button"}
      className={`${styles.control} ${styles[variant]}`}
      disabled={disabled}
      onClick={onActivate}
    >
      {label}
    </button>
  );
}
