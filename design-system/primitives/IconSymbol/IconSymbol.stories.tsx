import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconSymbol } from "./IconSymbol";

const meta = {
  title: "Primitives/IconSymbol",
  component: IconSymbol
} satisfies Meta<typeof IconSymbol>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Workshop: Story = {
  args: {
    name: "workshop"
  }
};

export const Status: Story = {
  args: {
    name: "check"
  }
};
