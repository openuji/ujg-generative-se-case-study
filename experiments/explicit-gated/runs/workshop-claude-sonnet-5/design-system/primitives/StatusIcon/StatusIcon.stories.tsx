import type { Meta, StoryObj } from "@storybook/react";
import { StatusIcon } from "./StatusIcon";

const meta = {
  title: "Primitives/StatusIcon",
  component: StatusIcon
} satisfies Meta<typeof StatusIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = { args: { tone: "success" } };

export const Warning: Story = { args: { tone: "warning" } };

export const Error: Story = { args: { tone: "error" } };

export const Info: Story = { args: { tone: "info" } };

export const InlineSize: Story = { args: { tone: "info", size: "inline" } };
