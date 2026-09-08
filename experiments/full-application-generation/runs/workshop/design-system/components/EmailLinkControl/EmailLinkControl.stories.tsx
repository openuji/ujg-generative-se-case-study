import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmailLinkControl } from "./EmailLinkControl";

const meta = {
  title: "Components/EmailLinkControl",
  component: EmailLinkControl
} satisfies Meta<typeof EmailLinkControl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Link: Story = {
  args: {
    href: "https://example.com/offer",
    label: "Open offer"
  }
};
