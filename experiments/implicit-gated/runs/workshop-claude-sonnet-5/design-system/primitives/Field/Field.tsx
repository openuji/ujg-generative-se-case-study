import type { ReactNode } from "react";

export interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5" data-invalid={error ? "true" : undefined}>
      <label className="text-sm font-medium text-ink" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-error-ink" role="alert">
          {error}
        </p>
      ) : undefined}
    </div>
  );
}
