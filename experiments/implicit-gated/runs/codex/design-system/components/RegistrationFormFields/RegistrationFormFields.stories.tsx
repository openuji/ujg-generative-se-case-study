import { userEvent, within, expect } from "storybook/test";
import { RegistrationFormFields } from "./RegistrationFormFields";

export default { title: "Components/Registration Form Fields", component: RegistrationFormFields };

export const Basic = {
  args: {
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
    accessibilityNotes: "Please share materials in advance."
  }
};

export const Interaction = {
  render: () => (
    <form aria-label="Registration details">
      <RegistrationFormFields />
      <button type="submit">Serialize</button>
    </form>
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Full name"), "Alex Morgan");
    await userEvent.type(canvas.getByLabelText("Email"), "alex.morgan@example.com");
    await userEvent.type(canvas.getByLabelText("Accessibility notes"), "Please share materials in advance.");
    const form = canvas.getByRole("form");
    const data = Object.fromEntries(new FormData(form as HTMLFormElement));
    expect(data).toEqual({
      name: "Alex Morgan",
      email: "alex.morgan@example.com",
      accessibilityNotes: "Please share materials in advance."
    });
  }
};
