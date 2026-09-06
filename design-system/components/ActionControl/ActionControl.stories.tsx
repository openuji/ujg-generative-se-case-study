import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionControl } from "./ActionControl";

const meta = {
  title: "Components/Controls/ActionControl",
  component: ActionControl
} satisfies Meta<typeof ActionControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Continue"
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    label: "Continue"
  }
};

export const Secondary: Story = {
  args: {
    label: "Edit details",
    variant: "secondary"
  }
};
