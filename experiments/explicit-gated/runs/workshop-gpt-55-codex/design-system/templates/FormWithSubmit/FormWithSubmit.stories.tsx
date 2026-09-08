import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionControl } from "../../components/ActionControl/ActionControl";
import { RegistrationFormFields } from "../../components/RegistrationFormFields/RegistrationFormFields";
import { registrationFormData } from "../../src/fixtures";
import { FormWithSubmit } from "./FormWithSubmit";

const meta = {
  title: "Templates/FormWithSubmit",
  component: FormWithSubmit
} satisfies Meta<typeof FormWithSubmit>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RegistrationForm: Story = {
  args: {
    formFields: <RegistrationFormFields {...registrationFormData} />,
    formSubmitAction: <ActionControl label="Review" type="submit" />
  }
};
