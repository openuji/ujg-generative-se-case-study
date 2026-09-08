import styles from "./ActionControl.module.css";

export interface ActionControlProps {
  label: string;
  variant?: "primary" | "secondary" | "destructive";
  type?: "button" | "submit" | "reset";
  name?: string;
  value?: string;
  disabled?: boolean;
  onAction?: () => void;
}

export function ActionControl({
  label,
  variant = "primary",
  type = "button",
  name,
  value,
  disabled = false,
  onAction
}: ActionControlProps) {
  return (
    <button
      className={`${styles.root} ${styles[variant]}`}
      type={type}
      name={name}
      value={value}
      disabled={disabled}
      onClick={onAction}
    >
      {label}
    </button>
  );
}
