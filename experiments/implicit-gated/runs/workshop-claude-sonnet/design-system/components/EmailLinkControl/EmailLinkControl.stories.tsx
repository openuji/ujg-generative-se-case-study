import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmailLinkControl } from "./EmailLinkControl";

const meta: Meta<typeof EmailLinkControl> = {
  title: "Components/EmailLinkControl",
  component: EmailLinkControl
};

export default meta;
type Story = StoryObj<typeof EmailLinkControl>;

export const Default: Story = {
  args: {
    label: "View your offer",
    href: "https://workshops.example.com/offers/abc123"
  }
};
