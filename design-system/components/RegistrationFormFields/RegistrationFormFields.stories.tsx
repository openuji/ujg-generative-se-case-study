import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import registrationFormSchema from "../../../ujg/schemas/registration-form-data.schema.json";
import { RegistrationFormFields } from "./RegistrationFormFields";

const editableSchemaProperties = Object.keys(registrationFormSchema.properties)
  .filter((property) => property !== "errors")
  .sort();

const meta = {
  title: "Components/Forms/RegistrationFormFields",
  component: RegistrationFormFields
} satisfies Meta<typeof RegistrationFormFields>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithErrors: Story = {
  args: {
    email: "alex@example",
    errors: {
      email: "Enter a valid email address.",
      name: "Enter a full name."
    },
    name: ""
  }
};

export const CanonicalSchemaSerialization: Story = {
  render: (args) => (
    <form aria-label="Registration schema serialization">
      <RegistrationFormFields {...args} />
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText("Full name"), "Alex Nguyen");
    await userEvent.type(canvas.getByLabelText("Email address"), "alex@example.com");
    await userEvent.type(canvas.getByLabelText("Accessibility notes"), "Step-free access");

    const form = canvas.getByRole("form", { name: "Registration schema serialization" });
    if (!(form instanceof HTMLFormElement)) {
      throw new TypeError("Registration story must render an HTML form");
    }
    const formData = new FormData(form);

    await expect([...formData.keys()].sort()).toEqual(editableSchemaProperties);
    await expect(Object.fromEntries(formData.entries())).toEqual({
      accessibilityNotes: "Step-free access",
      email: "alex@example.com",
      name: "Alex Nguyen"
    });
  }
};
