import type { Meta, StoryObj } from "@storybook/react";
import { WorkshopTeaserContent } from "./WorkshopTeaserContent";

const meta = {
  title: "Components/WorkshopTeaserContent",
  component: WorkshopTeaserContent
} satisfies Meta<typeof WorkshopTeaserContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Teaser: Story = {
  args: {
    title: "Designing accessible workshops",
    summary: "A hands-on session about inclusive facilitation.",
    date: "12 March 2026, 09:30",
    location: "Studio 2, Rotterdam"
  }
};
