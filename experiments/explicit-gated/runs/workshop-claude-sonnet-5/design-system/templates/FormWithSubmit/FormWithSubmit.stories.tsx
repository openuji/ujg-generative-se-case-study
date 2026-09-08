import type { Meta, StoryObj } from "@storybook/react";
import { ActionControl } from "../../components/ActionControl/ActionControl";
import { RegistrationFormFields } from "../../components/RegistrationFormFields/RegistrationFormFields";
import { WaitlistFormFields } from "../../components/WaitlistFormFields/WaitlistFormFields";
import { FormWithSubmit } from "./FormWithSubmit";

const meta = {
  title: "Templates/FormWithSubmit",
  component: FormWithSubmit
} satisfies Meta<typeof FormWithSubmit>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RegistrationDetails: Story = {
  args: {
    label: "Registration details",
    fields: <RegistrationFormFields />,
    submitAction: <ActionControl label="Submit registration details" behavior="submit" />
  }
};

export const RegistrationDetailsWithErrors: Story = {
  args: {
    label: "Registration details",
    fields: (
      <RegistrationFormFields
        name=""
        email="not-an-address"
        errors={{ name: "Enter your name.", email: "Enter an email address." }}
      />
    ),
    submitAction: <ActionControl label="Submit registration details" behavior="submit" />
  }
};

export const WaitlistDetails: Story = {
  args: {
    label: "Waitlist details",
    fields: <WaitlistFormFields />,
    submitAction: <ActionControl label="Submit waitlist details" behavior="submit" />
  }
};

export const WaitlistDetailsWithErrors: Story = {
  args: {
    label: "Waitlist details",
    fields: (
      <WaitlistFormFields
        name=""
        email="not-an-address"
        errors={{ name: "Enter your name.", email: "Enter an email address." }}
      />
    ),
    submitAction: <ActionControl label="Submit waitlist details" behavior="submit" />
  }
};

/** Stacked field rhythm with a full-width submit command. */
export const RegistrationDetailsOnMobile: Story = {
  args: {
    label: "Registration details",
    fields: <RegistrationFormFields />,
    submitAction: <ActionControl label="Submit registration details" behavior="submit" />
  },
  globals: { viewport: { value: "mobile" } }
};

/** The submit command takes its natural width from the small breakpoint upward. */
export const RegistrationDetailsOnDesktop: Story = {
  args: {
    label: "Registration details",
    fields: <RegistrationFormFields />,
    submitAction: <ActionControl label="Submit registration details" behavior="submit" />
  },
  globals: { viewport: { value: "desktop" } }
};
