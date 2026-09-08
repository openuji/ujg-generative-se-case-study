import type { Meta, StoryObj } from "@storybook/react";
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

const registrationReview = {
  summary: (
    <RegistrationReviewSummary
      workshopTitle="Designing accessible workshops"
      name="Ada Lovelace"
      email="ada@example.org"
    />
  ),
  editAction: <ActionControl label="Edit registration details" variant="secondary" />,
  submitAction: <ActionControl label="Confirm registration" />
};

export const RegistrationReview: Story = {
  args: registrationReview
};

export const WaitlistReview: Story = {
  args: {
    summary: (
      <WaitlistReviewSummary
        workshopTitle="Designing accessible workshops"
        name="Ada Lovelace"
        email="ada@example.org"
      />
    ),
    editAction: <ActionControl label="Edit waitlist details" variant="secondary" />,
    submitAction: <ActionControl label="Join waitlist" />
  }
};

/** Stacked, full-width commands. */
export const RegistrationReviewOnMobile: Story = {
  args: registrationReview,
  globals: { viewport: { value: "mobile" } }
};

/** Commands pair up on the trailing edge from the small breakpoint upward. */
export const RegistrationReviewOnDesktop: Story = {
  args: registrationReview,
  globals: { viewport: { value: "desktop" } }
};
