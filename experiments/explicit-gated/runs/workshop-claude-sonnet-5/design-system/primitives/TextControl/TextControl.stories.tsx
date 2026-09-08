import type { Meta, StoryObj } from "@storybook/react";
import { TextControl } from "./TextControl";

const meta = {
  title: "Primitives/TextControl",
  component: TextControl
} satisfies Meta<typeof TextControl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SingleLine: Story = {
  args: {
    label: "Full name",
    name: "example",
    defaultValue: "Ada Lovelace"
  }
};

export const MultiLine: Story = {
  args: {
    label: "Notes",
    name: "exampleNotes",
    multiline: true,
    defaultValue: "Step-free access, please."
  }
};

export const WithValidationMessage: Story = {
  args: {
    label: "Email address",
    name: "exampleEmail",
    defaultValue: "not-an-address",
    error: "Enter an email address."
  }
};
