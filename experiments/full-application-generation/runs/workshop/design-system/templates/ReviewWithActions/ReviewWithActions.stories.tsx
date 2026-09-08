import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionControl } from "../../components/ActionControl/ActionControl";
import { RegistrationReviewSummary } from "../../components/RegistrationReviewSummary/RegistrationReviewSummary";
import { registrationReviewData } from "../../src/fixtures";
import { ReviewWithActions } from "./ReviewWithActions";

const meta = {
  title: "Templates/ReviewWithActions",
  component: ReviewWithActions
} satisfies Meta<typeof ReviewWithActions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RegistrationReview: Story = {
  args: {
    reviewSummary: <RegistrationReviewSummary {...registrationReviewData} />,
    reviewEditAction: <ActionControl label="Edit" />,
    reviewSubmitAction: <ActionControl label="Confirm" />
  }
};
