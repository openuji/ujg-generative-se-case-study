import type { Meta, StoryObj } from "@storybook/react-vite";
import { WorkshopTeaserContent } from "./WorkshopTeaserContent";

const meta = {
  title: "Components/Workshop/WorkshopTeaserContent",
  component: WorkshopTeaserContent
} satisfies Meta<typeof WorkshopTeaserContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    date: "15 October",
    location: "Berlin studio",
    summary: "A hands-on session for learning practical service design techniques.",
    title: "Service Design Foundations"
  }
};
