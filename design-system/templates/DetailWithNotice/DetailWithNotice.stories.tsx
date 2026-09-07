import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusNotice } from "../../components/StatusNotice/StatusNotice";
import { WorkshopDetailSummary } from "../../components/WorkshopDetailSummary/WorkshopDetailSummary";
import { DetailWithNotice } from "./DetailWithNotice";

const meta = {
  title: "Templates/DetailWithNotice",
  component: DetailWithNotice
} satisfies Meta<typeof DetailWithNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AlreadyRegistered: Story = {
  args: {
    summary: (
      <WorkshopDetailSummary
        availability="Already registered"
        date="15 October"
        description="A practical workshop with exercises, review points, and guided facilitation."
        location="Berlin studio"
        title="Service Design Foundations"
      />
    ),
    notice: <StatusNotice message="You are already registered for this workshop." tone="success" />
  }
};

export const AlreadyWaitlisted: Story = {
  args: {
    summary: (
      <WorkshopDetailSummary
        availability="Already waitlisted"
        date="18 October"
        description="The workshop is currently full, but waitlist places can still be requested."
        location="Berlin studio"
        title="Facilitation Practice"
      />
    ),
    notice: <StatusNotice message="You are already on the waitlist for this workshop." tone="info" />
  }
};

export const Mobile: Story = {
  args: AlreadyWaitlisted.args,
  parameters: {
    viewport: {
      defaultViewport: "ujgMobile"
    }
  }
};

export const Desktop: Story = {
  args: AlreadyWaitlisted.args,
  parameters: {
    viewport: {
      defaultViewport: "ujgDesktop"
    }
  }
};
