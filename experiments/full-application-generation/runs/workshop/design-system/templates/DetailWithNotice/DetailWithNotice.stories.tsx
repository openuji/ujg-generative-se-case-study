import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusNotice } from "../../components/StatusNotice/StatusNotice";
import { WorkshopDetailSummary } from "../../components/WorkshopDetailSummary/WorkshopDetailSummary";
import { detailData, noticeData } from "../../src/fixtures";
import { DetailWithNotice } from "./DetailWithNotice";

const meta = {
  title: "Templates/DetailWithNotice",
  component: DetailWithNotice
} satisfies Meta<typeof DetailWithNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AlreadyRegistered: Story = {
  args: {
    detailSummary: <WorkshopDetailSummary {...detailData} />,
    detailNotice: <StatusNotice {...noticeData} />
  }
};
