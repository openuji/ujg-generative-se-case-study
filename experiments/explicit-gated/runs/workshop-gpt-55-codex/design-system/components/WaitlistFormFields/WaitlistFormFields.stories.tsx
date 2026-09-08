import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { waitlistFormData } from "../../src/fixtures";
import { WaitlistFormFields } from "./WaitlistFormFields";

const meta = {
  title: "Components/WaitlistFormFields",
  component: WaitlistFormFields
} satisfies Meta<typeof WaitlistFormFields>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithErrors: Story = {
  args: waitlistFormData
};

export const FormDataContract: Story = {
  render: (args) => (
    <form aria-label="Waitlist contract">
      <WaitlistFormFields {...args} />
      <button type="submit">Save</button>
    </form>
  ),
  args: {
    name: "",
    email: "",
    notes: ""
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText("Full name"), "Sam Rivera");
    await userEvent.type(canvas.getByLabelText("Email"), "sam@example.com");
    await userEvent.type(canvas.getByLabelText("Notes"), "Flexible timing");

    const form = canvas.getByRole("form", { name: "Waitlist contract" }) as HTMLFormElement;
    const formData = Object.fromEntries(new FormData(form).entries());

    await expect(formData).toEqual({
      name: "Sam Rivera",
      email: "sam@example.com",
      notes: "Flexible timing"
    });
    await expect(Object.keys(formData)).not.toContain("errors");
  }
};
