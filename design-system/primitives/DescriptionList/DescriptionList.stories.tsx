import type { Meta, StoryObj } from "@storybook/react-vite";
import { DescriptionList } from "./DescriptionList";

const meta = {
  title: "Primitives/DescriptionList",
  component: DescriptionList
} satisfies Meta<typeof DescriptionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    terms: [
      { term: "Label", value: "Value" },
      { term: "Status", value: "Available" }
    ]
  }
};
