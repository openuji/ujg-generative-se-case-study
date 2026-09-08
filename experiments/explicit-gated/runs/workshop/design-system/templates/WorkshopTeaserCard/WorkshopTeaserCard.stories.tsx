import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionControl } from "../../components/ActionControl/ActionControl";
import { WorkshopTeaserContent } from "../../components/WorkshopTeaserContent/WorkshopTeaserContent";
import { teaserData } from "../../src/fixtures";
import { WorkshopTeaserCard } from "./WorkshopTeaserCard";

const meta = {
  title: "Templates/WorkshopTeaserCard",
  component: WorkshopTeaserCard
} satisfies Meta<typeof WorkshopTeaserCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Card: Story = {
  args: {
    teaserContent: <WorkshopTeaserContent {...teaserData} />,
    teaserAction: <ActionControl label="Open" />
  }
};
