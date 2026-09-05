import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionControl } from "../../components/ActionControl/ActionControl";
import { RegistrationFormFields } from "../../components/RegistrationFormFields/RegistrationFormFields";
import { WaitlistFormFields } from "../../components/WaitlistFormFields/WaitlistFormFields";
import { FormWithSubmit } from "./FormWithSubmit";

const meta = {
  title: "Templates/FormWithSubmit",
  component: FormWithSubmit,
  parameters: {
    ujgFrame: "wide"
  }
} satisfies Meta<typeof FormWithSubmit>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RegistrationForm: Story = {
  args: {
    fields: <RegistrationFormFields />,
    submitAction: <ActionControl label="Continue" type="submit" />
  }
};

export const RegistrationFormMobile: Story = {
  args: RegistrationForm.args,
  parameters: {
    viewport: {
      defaultViewport: "ujgMobile"
    }
  }
};

export const RegistrationFormDesktop: Story = {
  args: RegistrationForm.args,
  parameters: {
    viewport: {
      defaultViewport: "ujgDesktop"
    }
  }
};

export const RegistrationFormWithErrors: Story = {
  args: {
    fields: (
      <RegistrationFormFields
        email="alex@example"
        errors={{ email: "Enter a valid email address." }}
        name="Alex Nguyen"
      />
    ),
    submitAction: <ActionControl label="Continue" type="submit" />
  }
};

export const WaitlistForm: Story = {
  args: {
    fields: <WaitlistFormFields />,
    submitAction: <ActionControl label="Continue" type="submit" />
  }
};
