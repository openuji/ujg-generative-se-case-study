import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldControl } from "./FieldControl";

const meta = {
  title: "Primitives/FieldControl",
  component: FieldControl
} satisfies Meta<typeof FieldControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextInput: Story = {
  args: {
    label: "Label",
    name: "example",
    value: "Example value"
  }
};

export const WithError: Story = {
  args: {
    error: "This field needs attention.",
    label: "Label",
    name: "example-error"
  }
};
