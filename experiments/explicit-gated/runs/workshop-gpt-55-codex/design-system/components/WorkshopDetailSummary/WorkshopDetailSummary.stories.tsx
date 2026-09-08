import type { Meta, StoryObj } from "@storybook/react-vite";
import { detailData } from "../../src/fixtures";
import { WorkshopDetailSummary } from "./WorkshopDetailSummary";

const meta = {
  title: "Components/WorkshopDetailSummary",
  component: WorkshopDetailSummary
} satisfies Meta<typeof WorkshopDetailSummary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Summary: Story = {
  args: detailData
};
