import type { Meta, StoryObj } from "@storybook/react";
import { ActionControl } from "../../components/ActionControl/ActionControl";
import { WorkshopDetailSummary } from "../../components/WorkshopDetailSummary/WorkshopDetailSummary";
import { DetailWithAction } from "./DetailWithAction";

const meta = {
  title: "Templates/DetailWithAction",
  component: DetailWithAction
} satisfies Meta<typeof DetailWithAction>;

export default meta;

type Story = StoryObj<typeof meta>;

const summary = (
  <WorkshopDetailSummary
    title="Designing accessible workshops"
    description="A full-day, hands-on session about inclusive facilitation and materials."
    date="12 March 2026, 09:30"
    location="Studio 2, Rotterdam"
    availability="4 places left"
  />
);

export const RegistrationOpen: Story = {
  args: {
    summary,
    action: <ActionControl label="Register" />
  }
};

export const WaitlistOpen: Story = {
  args: {
    summary: (
      <WorkshopDetailSummary
        title="Designing accessible workshops"
        description="A full-day, hands-on session about inclusive facilitation and materials."
        date="12 March 2026, 09:30"
        location="Studio 2, Rotterdam"
        availability="Fully booked — waitlist open"
      />
    ),
    action: <ActionControl label="Join waitlist" />
  }
};

/** Stacked: the command panel drops under the workshop and fills the line. */
export const RegistrationOpenOnMobile: Story = {
  args: { summary, action: <ActionControl label="Register" /> },
  globals: { viewport: { value: "mobile" } }
};

/** Split: the command panel sits beside the workshop from the large breakpoint. */
export const RegistrationOpenOnDesktop: Story = {
  args: { summary, action: <ActionControl label="Register" /> },
  globals: { viewport: { value: "desktop" } }
};
