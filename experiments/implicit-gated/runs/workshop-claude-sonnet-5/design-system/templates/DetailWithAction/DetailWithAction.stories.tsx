import type { Meta, StoryObj } from "@storybook/react-vite";
import { DetailWithAction } from "./DetailWithAction";
import { WorkshopDetailSummary } from "../../components/WorkshopDetailSummary/WorkshopDetailSummary";
import { ActionControl } from "../../components/ActionControl/ActionControl";

const meta: Meta<typeof DetailWithAction> = {
  title: "Templates/DetailWithAction",
  component: DetailWithAction
};

export default meta;
type Story = StoryObj<typeof DetailWithAction>;

export const RegistrationOpen: Story = {
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
    detailAction: <ActionControl label="Register" />
  }
};
