import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, userEvent, expect, fn } from "storybook/test";
import { FormWithSubmit } from "./FormWithSubmit";
import { RegistrationFormFields } from "../../components/RegistrationFormFields/RegistrationFormFields";
import { ActionControl } from "../../components/ActionControl/ActionControl";

const meta: Meta<typeof FormWithSubmit> = {
  title: "Templates/FormWithSubmit",
  component: FormWithSubmit,
  args: {
    onSubmit: fn()
  }
};

export default meta;
type Story = StoryObj<typeof FormWithSubmit>;

export const RegistrationForm: Story = {
  args: {
    formFields: <RegistrationFormFields />,
    formSubmitAction: <ActionControl label="Continue" type="submit" />
  }
};

export const RegistrationFormSubmission: Story = {
  args: {
    formFields: <RegistrationFormFields />,
    formSubmitAction: <ActionControl label="Continue" type="submit" />
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Full name"), "Priya Shah");
    await userEvent.type(canvas.getByLabelText("Email address"), "priya@example.com");
    await userEvent.type(canvas.getByLabelText("Accessibility notes"), "Wheelchair access needed.");
    await userEvent.click(canvas.getByRole("button", { name: "Continue" }));

    const onSubmit = args.onSubmit as unknown as ReturnType<typeof fn>;
    await expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = onSubmit.mock.calls[0][0] as FormData;
    await expect(submitted.get("name")).toBe("Priya Shah");
    await expect(submitted.get("email")).toBe("priya@example.com");
    await expect(submitted.get("accessibilityNotes")).toBe("Wheelchair access needed.");
    await expect(submitted.has("errors")).toBe(false);
  }
};
