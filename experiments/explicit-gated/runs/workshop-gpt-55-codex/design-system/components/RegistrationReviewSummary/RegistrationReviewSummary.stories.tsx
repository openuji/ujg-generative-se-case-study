import type { Meta, StoryObj } from "@storybook/react-vite";
import { registrationReviewData } from "../../src/fixtures";
import { RegistrationReviewSummary } from "./RegistrationReviewSummary";

const meta = {
  title: "Components/RegistrationReviewSummary",
  component: RegistrationReviewSummary
} satisfies Meta<typeof RegistrationReviewSummary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Summary: Story = {
  args: registrationReviewData
};
