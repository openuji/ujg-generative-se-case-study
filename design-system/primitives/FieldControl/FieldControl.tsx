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
    <div>
      <label htmlFor={inputId}>{label}</label>
      {type === "textarea" ? (
        <textarea aria-invalid={Boolean(error)} defaultValue={value} id={inputId} name={name} />
      ) : (
        <input aria-invalid={Boolean(error)} defaultValue={value} id={inputId} name={name} type={type} />
      )}
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
