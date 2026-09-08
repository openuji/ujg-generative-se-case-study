import type { Meta, StoryObj } from "@storybook/react";
import { StatusNotice } from "./StatusNotice";

const meta = {
  title: "Components/StatusNotice",
  component: StatusNotice
} satisfies Meta<typeof StatusNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AlreadyRegistered: Story = {
  args: {
    message: "You are already registered for this workshop.",
    tone: "info"
  }
};

export const AlreadyWaitlisted: Story = {
  args: {
    message: "You are already on the waitlist for this workshop.",
    tone: "info"
  }
};

export const WithoutTone: Story = {
  args: {
    message: "Places are released as soon as somebody cancels."
  }
};

export const PlaceSecured: Story = {
  args: {
    message: "Your place is confirmed.",
    tone: "success"
  }
};

export const OfferLapsing: Story = {
  args: {
    message: "This offer lapses in under an hour.",
    tone: "warning"
  }
};

export const RegistrationClosed: Story = {
  args: {
    message: "Registration for this workshop has closed.",
    tone: "error"
  }
};
