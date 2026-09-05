import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusBadge } from "./StatusBadge";

const meta = {
  title: "Primitives/StatusBadge",
  component: StatusBadge
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    children: "Open",
    tone: "success"
  }
};

export const Warning: Story = {
  args: {
    children: "Limited",
    tone: "warning"
  }
};

export const Info: Story = {
  args: {
    children: "Waitlisted",
    tone: "info"
  }
};
