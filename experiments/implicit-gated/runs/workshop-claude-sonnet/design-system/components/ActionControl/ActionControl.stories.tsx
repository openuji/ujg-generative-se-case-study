import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionControl } from "./ActionControl";

const meta: Meta<typeof ActionControl> = {
  title: "Components/ActionControl",
  component: ActionControl
};

export default meta;
type Story = StoryObj<typeof ActionControl>;

export const Primary: Story = {
  args: {
    label: "Register",
    variant: "primary"
  }
};

export const Secondary: Story = {
  args: {
    label: "Edit details",
    variant: "secondary"
  }
};

export const Submit: Story = {
  args: {
    label: "Confirm registration",
    type: "submit"
  }
};
