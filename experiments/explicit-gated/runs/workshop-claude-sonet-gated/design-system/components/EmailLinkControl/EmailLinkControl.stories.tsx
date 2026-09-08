import type { Meta, StoryObj } from "@storybook/react";
import { EmailLinkControl } from "./EmailLinkControl";

const meta = {
  title: "Components/EmailLinkControl",
  component: EmailLinkControl
} satisfies Meta<typeof EmailLinkControl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OfferedPlaceLink: Story = {
  args: {
    label: "Open offered place",
    href: "https://example.org/offered-place/abc123"
  }
};
