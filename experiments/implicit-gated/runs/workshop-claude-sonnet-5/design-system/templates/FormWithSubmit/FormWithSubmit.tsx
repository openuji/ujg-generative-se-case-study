import type { FormEvent, ReactNode } from "react";

export interface FormWithSubmitProps {
  formFields: ReactNode;
  formSubmitAction: ReactNode;
  onSubmit?: (formData: FormData) => void;
}

export function FormWithSubmit({ formFields, formSubmitAction, onSubmit }: FormWithSubmitProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit?.(new FormData(event.currentTarget));
  }

  return (
    <form
      className="flex flex-col gap-6 rounded-lg border border-line bg-raised p-4 shadow-sm sm:p-6"
      onSubmit={handleSubmit}
      noValidate
    >
      {formFields}
      <div>{formSubmitAction}</div>
    </form>
  );
}
