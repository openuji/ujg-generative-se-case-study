import type { Meta, StoryObj } from "@storybook/react";
import { StatusMessage } from "./StatusMessage";

const meta = {
  title: "Components/StatusMessage",
  component: StatusMessage
} satisfies Meta<typeof StatusMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Confirmation: Story = {
  args: {
    title: "You are registered",
    message: "We sent a confirmation to your email address.",
    tone: "success",
    details: [
      { term: "Workshop", value: "Designing accessible workshops" },
      { term: "Date", value: "12 March 2026, 09:30" }
    ]
  }
};

export const Informational: Story = {
  args: {
    title: "Registration is closed",
    message: "This workshop no longer accepts registrations."
  }
};

export const Warning: Story = {
  args: {
    title: "This offer has expired",
    message: "The place was released to the next person on the waitlist.",
    tone: "warning"
  }
};

export const OfferDeclined: Story = {
  args: {
    title: "Registration cancelled",
    message: "Your place has been released and is now available to somebody else.",
    tone: "error",
    details: [{ term: "Workshop", value: "Designing accessible workshops" }]
  }
};

export const OfferAvailable: Story = {
  args: {
    title: "A place is available for you",
    message: "Somebody cancelled, so the next place on the waitlist is yours.",
    tone: "info",
    details: [{ term: "Offer expires", value: "9 March 2026, 17:00" }]
  }
};
