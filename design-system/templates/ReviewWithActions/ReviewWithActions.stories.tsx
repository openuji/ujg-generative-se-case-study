import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionControl } from "../../components/ActionControl/ActionControl";
import { RegistrationReviewSummary } from "../../components/RegistrationReviewSummary/RegistrationReviewSummary";
import { WaitlistReviewSummary } from "../../components/WaitlistReviewSummary/WaitlistReviewSummary";
import { ReviewWithActions } from "./ReviewWithActions";

const meta = {
  title: "Templates/ReviewWithActions",
  component: ReviewWithActions
} satisfies Meta<typeof ReviewWithActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RegistrationReview: Story = {
  args: {
    editAction: <ActionControl label="Edit details" />,
    submitAction: <ActionControl label="Confirm registration" />,
    summary: (
      <RegistrationReviewSummary
        email="alex@example.com"
        name="Alex Nguyen"
        workshopTitle="Service Design Foundations"
      />
    )
  }
};

export const WaitlistReview: Story = {
  args: {
    editAction: <ActionControl label="Edit details" />,
    submitAction: <ActionControl label="Join waitlist" />,
    summary: (
      <WaitlistReviewSummary
        email="alex@example.com"
        name="Alex Nguyen"
        workshopTitle="Service Design Foundations"
      />
    )
  }
};
