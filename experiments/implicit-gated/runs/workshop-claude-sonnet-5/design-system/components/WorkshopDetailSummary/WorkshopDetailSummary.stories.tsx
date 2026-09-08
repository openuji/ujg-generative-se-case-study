import type { Meta, StoryObj } from "@storybook/react-vite";
import { WorkshopDetailSummary } from "./WorkshopDetailSummary";

const meta: Meta<typeof WorkshopDetailSummary> = {
  title: "Components/WorkshopDetailSummary",
  component: WorkshopDetailSummary
};

export default meta;
type Story = StoryObj<typeof WorkshopDetailSummary>;

export const RegistrationOpen: Story = {
  args: {
    title: "Intro to Ceramics",
    description: "A hands-on afternoon session covering wheel-throwing basics for beginners.",
    date: "2026-10-04",
    location: "Studio B, Riverside Arts Center",
    availability: "placeAvailable"
  }
};

export const WaitlistOpen: Story = {
  args: {
    ...RegistrationOpen.args,
    availability: "waitlistOpen"
  }
};
