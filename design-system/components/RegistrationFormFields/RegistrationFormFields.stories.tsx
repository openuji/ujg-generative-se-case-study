import type { Meta, StoryObj } from "@storybook/react-vite";
import { RegistrationFormFields } from "./RegistrationFormFields";

const meta = {
  title: "Components/Forms/RegistrationFormFields",
  component: RegistrationFormFields
} satisfies Meta<typeof RegistrationFormFields>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithErrors: Story = {
  args: {
    email: "alex@example",
    errors: {
      email: "Enter a valid email address.",
      name: "Enter a full name."
    },
    name: ""
  }
};
