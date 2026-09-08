import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmailOfferContent } from "./EmailOfferContent";

const meta: Meta<typeof EmailOfferContent> = {
  title: "Components/EmailOfferContent",
  component: EmailOfferContent
};

export default meta;
type Story = StoryObj<typeof EmailOfferContent>;

export const Default: Story = {
  args: {
    title: "A place opened up",
    message: "A registration place for Intro to Ceramics has become available for you.",
    workshopTitle: "Intro to Ceramics",
    expiresAt: "2026-10-01T18:00:00Z"
  }
};
