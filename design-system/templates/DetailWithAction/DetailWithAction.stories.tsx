import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionControl } from "../../components/ActionControl/ActionControl";
import { WorkshopDetailSummary } from "../../components/WorkshopDetailSummary/WorkshopDetailSummary";
import { DetailWithAction } from "./DetailWithAction";

const meta = {
  title: "Templates/DetailWithAction",
  component: DetailWithAction
} satisfies Meta<typeof DetailWithAction>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RegistrationOpen: Story = {
  args: {
    action: <ActionControl label="Register" />,
    summary: (
      <WorkshopDetailSummary
        availability="Registration open"
        date="15 October"
        description="A practical workshop with exercises, review points, and guided facilitation."
        location="Berlin studio"
        title="Service Design Foundations"
      />
    )
  }
};

export const WaitlistOpen: Story = {
  args: {
    action: <ActionControl label="Join waitlist" />,
    summary: (
      <WorkshopDetailSummary
        availability="Waitlist open"
        date="15 October"
        description="The workshop is currently full, but waitlist places can still be requested."
        location="Berlin studio"
        title="Service Design Foundations"
      />
    )
  }
};
