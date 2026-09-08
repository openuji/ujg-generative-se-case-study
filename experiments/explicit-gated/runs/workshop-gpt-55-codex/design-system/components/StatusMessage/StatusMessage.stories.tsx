import type { Meta, StoryObj } from "@storybook/react-vite";
import { statusData } from "../../src/fixtures";
import { StatusMessage } from "./StatusMessage";

const meta = {
  title: "Components/StatusMessage",
  component: StatusMessage
} satisfies Meta<typeof StatusMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Message: Story = {
  args: statusData
};
