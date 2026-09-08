import type { Meta, StoryObj } from "@storybook/react-vite";
import { WaitlistFormFields } from "./WaitlistFormFields";

const meta: Meta<typeof WaitlistFormFields> = {
  title: "Components/WaitlistFormFields",
  component: WaitlistFormFields
};

export default meta;
type Story = StoryObj<typeof WaitlistFormFields>;

export const Empty: Story = {
  args: {}
};

export const WithErrors: Story = {
  args: {
    email: "not-an-email",
    errors: {
      email: "Enter a valid email address."
    }
  }
};
