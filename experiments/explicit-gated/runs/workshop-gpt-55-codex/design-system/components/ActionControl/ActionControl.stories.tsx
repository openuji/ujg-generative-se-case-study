import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionControl } from "./ActionControl";

const meta = {
  title: "Components/ActionControl",
  component: ActionControl
} satisfies Meta<typeof ActionControl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Button: Story = {
  args: {
    label: "Continue"
  }
};

export const Submit: Story = {
  args: {
    label: "Submit",
    type: "submit"
  }
};
