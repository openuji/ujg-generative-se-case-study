import styles from "./FieldControl.module.css";

export type FieldControlProps = {
  error?: string;
  label: string;
  name: string;
  type?: "email" | "number" | "text" | "textarea";
  value?: string;
};

export function FieldControl({
  error,
  label,
  name,
  type = "text",
  value = ""
}: FieldControlProps) {
  const inputId = `${name}-field`;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>{label}</label>
      {type === "textarea" ? (
        <textarea aria-invalid={Boolean(error)} className={`${styles.control} ${styles.textarea}`} defaultValue={value} id={inputId} name={name} />
      ) : (
        <input aria-invalid={Boolean(error)} className={styles.control} defaultValue={value} id={inputId} name={name} type={type} />
      )}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </div>
  );
}
