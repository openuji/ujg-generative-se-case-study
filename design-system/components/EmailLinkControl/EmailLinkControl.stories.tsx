import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmailLinkControl } from "./EmailLinkControl";

const meta = {
  title: "Components/Controls/EmailLinkControl",
  component: EmailLinkControl
} satisfies Meta<typeof EmailLinkControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    href: "#",
    label: "Open offered place"
  }
};

export const Secondary: Story = {
  args: {
    href: "#",
    label: "View my registrations",
    variant: "secondary"
  }
};
