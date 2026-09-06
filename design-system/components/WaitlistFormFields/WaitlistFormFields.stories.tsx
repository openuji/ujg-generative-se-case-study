import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import waitlistFormSchema from "../../../ujg/schemas/waitlist-form-data.schema.json";
import { WaitlistFormFields } from "./WaitlistFormFields";

const editableSchemaProperties = Object.keys(waitlistFormSchema.properties)
  .filter((property) => property !== "errors")
  .sort();

const meta = {
  title: "Components/Forms/WaitlistFormFields",
  component: WaitlistFormFields
} satisfies Meta<typeof WaitlistFormFields>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithErrors: Story = {
  args: {
    email: "alex@example",
    errors: {
      email: "Enter a valid email address."
    },
    name: "Alex Nguyen"
  }
};

export const CanonicalSchemaSerialization: Story = {
  render: (args) => (
    <form aria-label="Waitlist schema serialization">
      <WaitlistFormFields {...args} />
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText("Full name"), "Sam Rivera");
    await userEvent.type(canvas.getByLabelText("Email address"), "sam@example.com");
    await userEvent.type(canvas.getByLabelText("Notes"), "Notify me by email");

    const form = canvas.getByRole("form", { name: "Waitlist schema serialization" });
    if (!(form instanceof HTMLFormElement)) {
      throw new TypeError("Waitlist story must render an HTML form");
    }
    const formData = new FormData(form);

    await expect([...formData.keys()].sort()).toEqual(editableSchemaProperties);
    await expect(Object.fromEntries(formData.entries())).toEqual({
      email: "sam@example.com",
      name: "Sam Rivera",
      notes: "Notify me by email"
    });
  }
};
