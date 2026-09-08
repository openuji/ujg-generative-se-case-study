import type { Meta, StoryObj } from "@storybook/react-vite";
import { waitlistReviewData } from "../../src/fixtures";
import { WaitlistReviewSummary } from "./WaitlistReviewSummary";

const meta = {
  title: "Components/WaitlistReviewSummary",
  component: WaitlistReviewSummary
} satisfies Meta<typeof WaitlistReviewSummary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Summary: Story = {
  args: waitlistReviewData
};
