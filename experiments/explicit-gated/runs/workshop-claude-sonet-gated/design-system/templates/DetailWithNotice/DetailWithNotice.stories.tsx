import type { Meta, StoryObj } from "@storybook/react";
import { StatusNotice } from "../../components/StatusNotice/StatusNotice";
import { WorkshopDetailSummary } from "../../components/WorkshopDetailSummary/WorkshopDetailSummary";
import { DetailWithNotice } from "./DetailWithNotice";

const meta = {
  title: "Templates/DetailWithNotice",
  component: DetailWithNotice
} satisfies Meta<typeof DetailWithNotice>;

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

export const AlreadyRegistered: Story = {
  args: {
    summary,
    notice: <StatusNotice message="You are already registered for this workshop." tone="info" />
  }
};

export const AlreadyWaitlisted: Story = {
  args: {
    summary,
    notice: <StatusNotice message="You are already on the waitlist for this workshop." tone="info" />
  }
};

/** Stacked: the notice follows the workshop. */
export const AlreadyRegisteredOnMobile: Story = {
  args: {
    summary,
    notice: <StatusNotice message="You are already registered for this workshop." tone="info" />
  },
  globals: { viewport: { value: "mobile" } }
};

/** Split: the notice becomes a secondary column from the large breakpoint. */
export const AlreadyRegisteredOnDesktop: Story = {
  args: {
    summary,
    notice: <StatusNotice message="You are already registered for this workshop." tone="info" />
  },
  globals: { viewport: { value: "desktop" } }
};
