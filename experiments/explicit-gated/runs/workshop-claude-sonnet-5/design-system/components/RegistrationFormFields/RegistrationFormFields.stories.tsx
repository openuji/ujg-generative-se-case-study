import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { RegistrationFormFields } from "./RegistrationFormFields";

const meta = {
  title: "Components/RegistrationFormFields",
  component: RegistrationFormFields
} satisfies Meta<typeof RegistrationFormFields>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {}
};

export const Prefilled: Story = {
  args: {
    name: "Ada Lovelace",
    email: "ada@example.org",
    accessibilityNotes: "Step-free access, please."
  }
};

export const WithValidationMessages: Story = {
  args: {
    name: "",
    email: "not-an-address",
    errors: {
      name: "Enter your name.",
      email: "Enter an email address."
    }
  }
};

export const SubmittedFieldContract: Story = {
  args: {},
  render: (args) => (
    <form aria-label="Registration details" onSubmit={(event) => event.preventDefault()}>
      <RegistrationFormFields {...args} />
      <button type="submit">Submit registration details</button>
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText("Name"), "Ada Lovelace");
    await userEvent.type(canvas.getByLabelText("Email"), "ada@example.org");
    await userEvent.type(canvas.getByLabelText("Accessibility notes"), "Step-free access");
    await userEvent.click(canvas.getByRole("button", { name: "Submit registration details" }));

    const form = canvas.getByRole("form", { name: "Registration details" });
    await expect(Object.fromEntries(new FormData(form as HTMLFormElement))).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.org",
      accessibilityNotes: "Step-free access"
    });
  }
};
