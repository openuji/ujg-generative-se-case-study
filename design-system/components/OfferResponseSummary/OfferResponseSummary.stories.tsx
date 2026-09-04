import type { Meta, StoryObj } from "@storybook/react-vite";
import { OfferResponseSummary } from "./OfferResponseSummary";

const meta = {
  title: "Components/Offer/OfferResponseSummary",
  component: OfferResponseSummary
} satisfies Meta<typeof OfferResponseSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    expiresAt: "18 October, 12:00",
    message: "Review the available place and choose how to respond.",
    title: "Offered place",
    workshopTitle: "Service Design Foundations"
  }
};
