import type { Meta, StoryObj } from "@storybook/react-vite";
import { RegistrationFormFields } from "./RegistrationFormFields";

const meta: Meta<typeof RegistrationFormFields> = {
  title: "Components/RegistrationFormFields",
  component: RegistrationFormFields
};

export default meta;
type Story = StoryObj<typeof RegistrationFormFields>;

export const Empty: Story = {
  args: {}
};

export const WithErrors: Story = {
  args: {
    name: "",
    email: "not-an-email",
    errors: {
      name: "Enter your full name.",
      email: "Enter a valid email address."
    }
  }
};
