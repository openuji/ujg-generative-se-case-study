import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionControl } from "../../components/ActionControl/ActionControl";
import { WorkshopDetailSummary } from "../../components/WorkshopDetailSummary/WorkshopDetailSummary";
import { detailData } from "../../src/fixtures";
import { DetailWithAction } from "./DetailWithAction";

const meta = {
  title: "Templates/DetailWithAction",
  component: DetailWithAction
} satisfies Meta<typeof DetailWithAction>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RegistrationOpen: Story = {
  args: {
    detailSummary: <WorkshopDetailSummary {...detailData} />,
    detailAction: <ActionControl label="Register" />
  }
};
