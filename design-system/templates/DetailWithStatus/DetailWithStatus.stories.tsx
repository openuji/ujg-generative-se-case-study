import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusMessage } from "../../components/StatusMessage/StatusMessage";
import { WorkshopDetailSummary } from "../../components/WorkshopDetailSummary/WorkshopDetailSummary";
import { DetailWithStatus } from "./DetailWithStatus";

const meta = {
  title: "Templates/DetailWithStatus",
  component: DetailWithStatus
} satisfies Meta<typeof DetailWithStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AlreadyRegistered: Story = {
  args: {
    status: (
      <StatusMessage
        details={[{ icon: "workshop", term: "Workshop", value: "Service Design Foundations" }]}
        message="You are already registered for this workshop."
        tone="success"
        title="Already registered"
      />
    ),
    summary: (
      <WorkshopDetailSummary
        availability="Already registered"
        date="15 October"
        description="A practical workshop with exercises, review points, and guided facilitation."
        location="Berlin studio"
        title="Service Design Foundations"
      />
    )
  }
};

export const AlreadyWaitlisted: Story = {
  args: {
    status: (
      <StatusMessage
        details={[{ icon: "workshop", term: "Workshop", value: "Facilitation Practice" }]}
        message="You are already on the waitlist for this workshop."
        tone="info"
        title="Already waitlisted"
      />
    ),
    summary: (
      <WorkshopDetailSummary
        availability="Already waitlisted"
        date="18 October"
        description="The workshop is currently full, but waitlist places can still be requested."
        location="Berlin studio"
        title="Facilitation Practice"
      />
    )
  }
};

export const Mobile: Story = {
  args: AlreadyRegistered.args,
  parameters: {
    viewport: {
      defaultViewport: "ujgMobile"
    }
  }
};

export const Desktop: Story = {
  args: AlreadyRegistered.args,
  parameters: {
    viewport: {
      defaultViewport: "ujgDesktop"
    }
  }
};
