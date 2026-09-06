import type { Meta, StoryObj } from "@storybook/react-vite";
import { Panel } from "./Panel";

const meta = {
  title: "Primitives/Panel",
  component: Panel
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Section title",
    children: <p>Section content</p>,
    actions: <button type="button">Action</button>
  }
};
