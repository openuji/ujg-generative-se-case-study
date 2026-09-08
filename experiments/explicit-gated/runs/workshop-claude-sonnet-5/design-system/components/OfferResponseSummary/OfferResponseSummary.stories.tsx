import type { Meta, StoryObj } from "@storybook/react";
import { OfferResponseSummary } from "./OfferResponseSummary";

const meta = {
  title: "Components/OfferResponseSummary",
  component: OfferResponseSummary
} satisfies Meta<typeof OfferResponseSummary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OpenOffer: Story = {
  args: {
    title: "Your offered place",
    message: "Accept the place or decline it and stay on the waitlist.",
    workshopTitle: "Designing accessible workshops",
    expiresAt: "9 March 2026, 17:00"
  }
};
