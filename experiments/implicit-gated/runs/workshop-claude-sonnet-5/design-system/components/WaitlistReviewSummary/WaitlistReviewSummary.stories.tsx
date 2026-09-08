import type { Meta, StoryObj } from "@storybook/react-vite";
import { WaitlistReviewSummary } from "./WaitlistReviewSummary";

const meta: Meta<typeof WaitlistReviewSummary> = {
  title: "Components/WaitlistReviewSummary",
  component: WaitlistReviewSummary
};

export default meta;
type Story = StoryObj<typeof WaitlistReviewSummary>;

export const Default: Story = {
  args: {
    workshopTitle: "Intro to Ceramics",
    name: "Priya Shah",
    email: "priya@example.com"
  }
};
