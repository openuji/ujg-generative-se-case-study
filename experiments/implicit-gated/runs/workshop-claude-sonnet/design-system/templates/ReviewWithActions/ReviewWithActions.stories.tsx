import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReviewWithActions } from "./ReviewWithActions";
import { RegistrationReviewSummary } from "../../components/RegistrationReviewSummary/RegistrationReviewSummary";
import { ActionControl } from "../../components/ActionControl/ActionControl";

const meta: Meta<typeof ReviewWithActions> = {
  title: "Templates/ReviewWithActions",
  component: ReviewWithActions
};

export default meta;
type Story = StoryObj<typeof ReviewWithActions>;

export const RegistrationReview: Story = {
  args: {
    reviewSummary: (
      <RegistrationReviewSummary workshopTitle="Intro to Ceramics" name="Priya Shah" email="priya@example.com" />
    ),
    reviewEditAction: <ActionControl label="Edit details" variant="secondary" />,
    reviewSubmitAction: <ActionControl label="Confirm registration" type="submit" />
  }
};

export const Mobile: Story = {
  args: RegistrationReview.args,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 375 }}>
        <Story />
      </div>
    )
  ]
};

export const Desktop: Story = {
  args: RegistrationReview.args,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 1024 }}>
        <Story />
      </div>
    )
  ]
};
