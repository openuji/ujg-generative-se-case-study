import { Field } from "../../primitives/Field/Field";

const INPUT_CLASSES =
  "w-full rounded-md border border-field-line bg-field px-3 py-2 text-sm text-ink placeholder:text-field-placeholder focus-visible:outline-none focus:border-action";

export interface RegistrationFormFieldsErrors {
  name?: string;
  email?: string;
  accessibilityNotes?: string;
}

export interface RegistrationFormFieldsProps {
  name?: string;
  email?: string;
  accessibilityNotes?: string;
  errors?: RegistrationFormFieldsErrors;
}

export function RegistrationFormFields({
  name,
  email,
  accessibilityNotes,
  errors
}: RegistrationFormFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Full name" htmlFor="registration-name" error={errors?.name}>
        <input id="registration-name" name="name" type="text" defaultValue={name} className={INPUT_CLASSES} />
      </Field>
      <Field label="Email address" htmlFor="registration-email" error={errors?.email}>
        <input id="registration-email" name="email" type="email" defaultValue={email} className={INPUT_CLASSES} />
      </Field>
      <Field
        label="Accessibility notes"
        htmlFor="registration-accessibility-notes"
        error={errors?.accessibilityNotes}
      >
        <textarea
          id="registration-accessibility-notes"
          name="accessibilityNotes"
          defaultValue={accessibilityNotes}
          rows={3}
          className={INPUT_CLASSES}
        />
      </Field>
    </div>
  );
}
