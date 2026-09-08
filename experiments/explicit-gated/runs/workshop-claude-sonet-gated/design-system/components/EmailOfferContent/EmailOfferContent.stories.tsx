import type { Meta, StoryObj } from "@storybook/react";
import { EmailOfferContent } from "./EmailOfferContent";

const meta = {
  title: "Components/EmailOfferContent",
  component: EmailOfferContent
} satisfies Meta<typeof EmailOfferContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OfferedPlace: Story = {
  args: {
    title: "A place is available for you",
    message: "Somebody cancelled, so the next place on the waitlist is yours.",
    workshopTitle: "Designing accessible workshops",
    expiresAt: "9 March 2026, 17:00"
  }
};
