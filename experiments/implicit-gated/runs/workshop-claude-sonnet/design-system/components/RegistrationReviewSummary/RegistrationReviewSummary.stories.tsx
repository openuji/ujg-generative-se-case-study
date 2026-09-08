import type { Meta, StoryObj } from "@storybook/react-vite";
import { RegistrationReviewSummary } from "./RegistrationReviewSummary";

const meta: Meta<typeof RegistrationReviewSummary> = {
  title: "Components/RegistrationReviewSummary",
  component: RegistrationReviewSummary
};

export default meta;
type Story = StoryObj<typeof RegistrationReviewSummary>;

export const Default: Story = {
  args: {
    workshopTitle: "Intro to Ceramics",
    name: "Priya Shah",
    email: "priya@example.com"
  }
};
