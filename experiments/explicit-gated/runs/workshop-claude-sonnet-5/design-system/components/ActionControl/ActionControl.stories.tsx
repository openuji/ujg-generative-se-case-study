import type { Meta, StoryObj } from "@storybook/react";
import { ActionControl } from "./ActionControl";

const meta = {
  title: "Components/ActionControl",
  component: ActionControl
} satisfies Meta<typeof ActionControl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Activation: Story = {
  args: {
    label: "Open workshop"
  }
};

export const FormSubmission: Story = {
  args: {
    label: "Submit registration details",
    behavior: "submit"
  }
};

export const Unavailable: Story = {
  args: {
    label: "Join waitlist",
    disabled: true
  }
};

/**
 * The three treatments below are the same control with the same interaction
 * semantics. They exist because the reference screens show a filled, an
 * outlined and a destructive presentation of one command affordance.
 */
export const PrimaryPresentation: Story = {
  args: {
    label: "Confirm registration",
    variant: "primary"
  }
};

export const SecondaryPresentation: Story = {
  args: {
    label: "Edit registration details",
    variant: "secondary"
  }
};

export const DestructivePresentation: Story = {
  args: {
    label: "Cancel registration",
    variant: "destructive"
  }
};
