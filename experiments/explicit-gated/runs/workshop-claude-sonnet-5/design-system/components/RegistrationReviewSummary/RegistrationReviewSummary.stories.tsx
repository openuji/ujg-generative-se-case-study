import type { Meta, StoryObj } from "@storybook/react";
import { RegistrationReviewSummary } from "./RegistrationReviewSummary";

const meta = {
  title: "Components/RegistrationReviewSummary",
  component: RegistrationReviewSummary
} satisfies Meta<typeof RegistrationReviewSummary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Review: Story = {
  args: {
    workshopTitle: "Designing accessible workshops",
    name: "Ada Lovelace",
    email: "ada@example.org"
  }
};
