import type { Meta, StoryObj } from "@storybook/react-vite";
import { WaitlistReviewSummary } from "./WaitlistReviewSummary";

const meta = {
  title: "Components/Review/WaitlistReviewSummary",
  component: WaitlistReviewSummary
} satisfies Meta<typeof WaitlistReviewSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    email: "alex@example.com",
    name: "Alex Nguyen",
    workshopTitle: "Service Design Foundations"
  }
};
