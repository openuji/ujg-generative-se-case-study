import type { Meta, StoryObj } from "@storybook/react";
import { ActionControl } from "../../components/ActionControl/ActionControl";
import { StatusMessage } from "../../components/StatusMessage/StatusMessage";
import { StatusWithAction } from "./StatusWithAction";

const meta = {
  title: "Templates/StatusWithAction",
  component: StatusWithAction
} satisfies Meta<typeof StatusWithAction>;

export default meta;

type Story = StoryObj<typeof meta>;

const alreadyWaitlisted = {
  content: (
    <StatusMessage
      title="You are already on the waitlist"
      message="We will email you as soon as a place becomes available."
      tone="info"
      details={[{ term: "Workshop", value: "Designing accessible workshops" }]}
    />
  ),
  action: <ActionControl label="Continue" />
};

export const AlreadyWaitlisted: Story = {
  args: alreadyWaitlisted
};

export const RegistrationConfirmed: Story = {
  args: {
    content: (
      <StatusMessage
        title="You are registered"
        message="Great news — your place in the workshop is secured."
        tone="success"
        details={[
          { term: "Workshop", value: "Designing accessible workshops" },
          { term: "Date", value: "12 March 2026, 09:30" }
        ]}
      />
    ),
    action: <ActionControl label="View my registrations" variant="secondary" />
  }
};

export const OfferExpired: Story = {
  args: {
    content: (
      <StatusMessage
        title="Your offer has expired"
        message="The place was not accepted in time and was released to the next person on the waitlist."
        tone="warning"
        details={[{ term: "Workshop", value: "Designing accessible workshops" }]}
      />
    ),
    action: <ActionControl label="Browse workshops" />
  }
};

/** Stacked, full-width command. */
export const AlreadyWaitlistedOnMobile: Story = {
  args: alreadyWaitlisted,
  globals: { viewport: { value: "mobile" } }
};

/** Centred column with a natural-width command. */
export const AlreadyWaitlistedOnDesktop: Story = {
  args: alreadyWaitlisted,
  globals: { viewport: { value: "desktop" } }
};
