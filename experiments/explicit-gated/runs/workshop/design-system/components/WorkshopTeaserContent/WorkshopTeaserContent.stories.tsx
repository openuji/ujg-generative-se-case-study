import type { Meta, StoryObj } from "@storybook/react-vite";
import { teaserData } from "../../src/fixtures";
import { WorkshopTeaserContent } from "./WorkshopTeaserContent";

const meta = {
  title: "Components/WorkshopTeaserContent",
  component: WorkshopTeaserContent
} satisfies Meta<typeof WorkshopTeaserContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Teaser: Story = {
  args: teaserData
};
