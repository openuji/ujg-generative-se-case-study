const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ContactDetails {
  name: string;
  email: string;
}

export interface ContactDetailsErrors {
  name?: string;
  email?: string;
}

export function validateContactDetails(values: ContactDetails): ContactDetailsErrors {
  const errors: ContactDetailsErrors = {};
  if (!values.name.trim()) errors.name = "Enter your full name.";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "Enter a valid email address.";
  return errors;
}
