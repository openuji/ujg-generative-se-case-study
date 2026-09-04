import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmailOfferContent } from "./EmailOfferContent";

const meta = {
  title: "Components/Offer/EmailOfferContent",
  component: EmailOfferContent
} satisfies Meta<typeof EmailOfferContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    expiresAt: "18 October, 12:00",
    message: "A place has opened for you from the waitlist.",
    title: "A workshop place is available",
    workshopTitle: "Service Design Foundations"
  }
};
