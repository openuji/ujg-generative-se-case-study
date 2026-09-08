import type { ReactNode } from "react";
import styles from "./Field.module.css";

type FieldProps = {
  label: string;
  name: string;
  error?: string;
  children: ReactNode;
};

export function Field({ label, name, error, children }: FieldProps) {
  const errorId = error ? `${name}-error` : undefined;
  return (
    <label className={styles.field} htmlFor={name}>
      <span className={styles.label}>{label}</span>
      {children}
      {error ? (
        <span className={styles.error} id={errorId}>
          {error}
        </span>
      ) : (
        <span className={styles.hint}> </span>
      )}
    </label>
  );
}
