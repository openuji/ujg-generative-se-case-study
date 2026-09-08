import type { Meta, StoryObj } from "@storybook/react";
import { WaitlistReviewSummary } from "./WaitlistReviewSummary";

const meta = {
  title: "Components/WaitlistReviewSummary",
  component: WaitlistReviewSummary
} satisfies Meta<typeof WaitlistReviewSummary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Review: Story = {
  args: {
    workshopTitle: "Designing accessible workshops",
    name: "Ada Lovelace",
    email: "ada@example.org"
  }
};
