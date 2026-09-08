import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { registrationFormData } from "../../src/fixtures";
import { RegistrationFormFields } from "./RegistrationFormFields";

const meta = {
  title: "Components/RegistrationFormFields",
  component: RegistrationFormFields
} satisfies Meta<typeof RegistrationFormFields>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithErrors: Story = {
  args: registrationFormData
};

export const FormDataContract: Story = {
  render: (args) => (
    <form aria-label="Registration contract">
      <RegistrationFormFields {...args} />
      <button type="submit">Save</button>
    </form>
  ),
  args: {
    name: "",
    email: "",
    accessibilityNotes: ""
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText("Full name"), "Ada Lovelace");
    await userEvent.type(canvas.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(canvas.getByLabelText("Accessibility notes"), "Captioning");

    const form = canvas.getByRole("form", { name: "Registration contract" }) as HTMLFormElement;
    const formData = Object.fromEntries(new FormData(form).entries());

    await expect(formData).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      accessibilityNotes: "Captioning"
    });
    await expect(Object.keys(formData)).not.toContain("errors");
  }
};
