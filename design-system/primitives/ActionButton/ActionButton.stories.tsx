import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionButton } from "./ActionButton";

const meta = {
  title: "Primitives/ActionButton",
  component: ActionButton
} satisfies Meta<typeof ActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Button: Story = {
  args: {
    children: "Continue"
  }
};

export const Secondary: Story = {
  args: {
    children: "Back",
    variant: "secondary"
  }
};

export const Link: Story = {
  args: {
    children: "Open message",
    href: "#"
  }
};
