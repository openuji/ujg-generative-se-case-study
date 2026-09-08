import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { WaitlistFormFields } from "./WaitlistFormFields";

const meta = {
  title: "Components/WaitlistFormFields",
  component: WaitlistFormFields
} satisfies Meta<typeof WaitlistFormFields>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {}
};

export const Prefilled: Story = {
  args: {
    name: "Ada Lovelace",
    email: "ada@example.org",
    notes: "Happy to take a late cancellation."
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
    <form aria-label="Waitlist details" onSubmit={(event) => event.preventDefault()}>
      <WaitlistFormFields {...args} />
      <button type="submit">Submit waitlist details</button>
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText("Name"), "Ada Lovelace");
    await userEvent.type(canvas.getByLabelText("Email"), "ada@example.org");
    await userEvent.type(canvas.getByLabelText("Notes"), "Any time slot works");
    await userEvent.click(canvas.getByRole("button", { name: "Submit waitlist details" }));

    const form = canvas.getByRole("form", { name: "Waitlist details" });
    await expect(Object.fromEntries(new FormData(form as HTMLFormElement))).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.org",
      notes: "Any time slot works"
    });
  }
};
