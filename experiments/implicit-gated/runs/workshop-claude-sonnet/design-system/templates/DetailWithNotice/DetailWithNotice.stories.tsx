import type { Meta, StoryObj } from "@storybook/react-vite";
import { DetailWithNotice } from "./DetailWithNotice";
import { WorkshopDetailSummary } from "../../components/WorkshopDetailSummary/WorkshopDetailSummary";
import { StatusNotice } from "../../components/StatusNotice/StatusNotice";

const meta: Meta<typeof DetailWithNotice> = {
  title: "Templates/DetailWithNotice",
  component: DetailWithNotice
};

export default meta;
type Story = StoryObj<typeof DetailWithNotice>;

export const AlreadyRegistered: Story = {
  args: {
    detailSummary: (
      <WorkshopDetailSummary
        title="Intro to Ceramics"
        description="A hands-on afternoon session covering wheel-throwing basics."
        date="2026-10-04"
        location="Studio B, Riverside Arts Center"
        availability="placeAvailable"
      />
    ),
    detailNotice: <StatusNotice message="You're already registered for this workshop." tone="info" />
  }
};
