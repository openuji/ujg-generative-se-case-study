import type { Meta, StoryObj } from "@storybook/react-vite";
import { WorkshopTeaserContent } from "./WorkshopTeaserContent";

const meta: Meta<typeof WorkshopTeaserContent> = {
  title: "Components/WorkshopTeaserContent",
  component: WorkshopTeaserContent
};

export default meta;
type Story = StoryObj<typeof WorkshopTeaserContent>;

export const Default: Story = {
  args: {
    title: "Intro to Ceramics",
    summary: "A hands-on afternoon session covering wheel-throwing basics.",
    date: "2026-10-04",
    location: "Studio B, Riverside Arts Center"
  }
};
