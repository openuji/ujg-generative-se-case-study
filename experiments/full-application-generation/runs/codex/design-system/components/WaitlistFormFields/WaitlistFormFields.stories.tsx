import { userEvent, within, expect } from "storybook/test";
import { WaitlistFormFields } from "./WaitlistFormFields";

export default { title: "Components/Waitlist Form Fields", component: WaitlistFormFields };

export const Basic = {
  args: {
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
    notes: "Please keep me posted about later sessions."
  }
};

export const Interaction = {
  render: () => (
    <form aria-label="Waitlist details">
      <WaitlistFormFields />
      <button type="submit">Serialize</button>
    </form>
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Full name"), "Alex Morgan");
    await userEvent.type(canvas.getByLabelText("Email"), "alex.morgan@example.com");
    await userEvent.type(canvas.getByLabelText("Notes"), "Later afternoon sessions also work.");
    const form = canvas.getByRole("form");
    const data = Object.fromEntries(new FormData(form as HTMLFormElement));
    expect(data).toEqual({
      name: "Alex Morgan",
      email: "alex.morgan@example.com",
      notes: "Later afternoon sessions also work."
    });
  }
};
