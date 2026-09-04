import type { Meta, StoryObj } from "@storybook/react-vite";
import { WaitlistFormFields } from "./WaitlistFormFields";

const meta = {
  title: "Components/Forms/WaitlistFormFields",
  component: WaitlistFormFields
} satisfies Meta<typeof WaitlistFormFields>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithErrors: Story = {
  args: {
    email: "alex@example",
    errors: {
      email: "Enter a valid email address."
    },
    name: "Alex Nguyen"
  }
};
