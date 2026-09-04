import type { Meta, StoryObj } from "@storybook/react-vite";
import { RegistrationReviewSummary } from "./RegistrationReviewSummary";

const meta = {
  title: "Components/Review/RegistrationReviewSummary",
  component: RegistrationReviewSummary
} satisfies Meta<typeof RegistrationReviewSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    email: "alex@example.com",
    name: "Alex Nguyen",
    workshopTitle: "Service Design Foundations"
  }
};
