import type { Meta, StoryObj } from "@storybook/react-vite";
import { OfferResponseSummary } from "./OfferResponseSummary";

const meta: Meta<typeof OfferResponseSummary> = {
  title: "Components/OfferResponseSummary",
  component: OfferResponseSummary
};

export default meta;
type Story = StoryObj<typeof OfferResponseSummary>;

export const Default: Story = {
  args: {
    title: "A place is available",
    message: "Accept within 48 hours to keep your place.",
    workshopTitle: "Intro to Ceramics",
    expiresAt: "2026-10-01T18:00:00Z"
  }
};
