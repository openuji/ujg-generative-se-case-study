import { Field } from "../../primitives/Field/Field";

const INPUT_CLASSES =
  "w-full rounded-md border border-field-line bg-field px-3 py-2 text-sm text-ink placeholder:text-field-placeholder focus-visible:outline-none focus:border-action";

export interface WaitlistFormFieldsErrors {
  name?: string;
  email?: string;
  notes?: string;
}

export interface WaitlistFormFieldsProps {
  name?: string;
  email?: string;
  notes?: string;
  errors?: WaitlistFormFieldsErrors;
}

export function WaitlistFormFields({ name, email, notes, errors }: WaitlistFormFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Full name" htmlFor="waitlist-name" error={errors?.name}>
        <input id="waitlist-name" name="name" type="text" defaultValue={name} className={INPUT_CLASSES} />
      </Field>
      <Field label="Email address" htmlFor="waitlist-email" error={errors?.email}>
        <input id="waitlist-email" name="email" type="email" defaultValue={email} className={INPUT_CLASSES} />
      </Field>
      <Field label="Notes" htmlFor="waitlist-notes" error={errors?.notes}>
        <textarea id="waitlist-notes" name="notes" defaultValue={notes} rows={3} className={INPUT_CLASSES} />
      </Field>
    </div>
  );
}
