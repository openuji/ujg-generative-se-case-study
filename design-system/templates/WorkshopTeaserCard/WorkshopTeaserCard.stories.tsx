import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionControl } from "../../components/ActionControl/ActionControl";
import { WorkshopTeaserContent } from "../../components/WorkshopTeaserContent/WorkshopTeaserContent";
import { WorkshopTeaserCard } from "./WorkshopTeaserCard";

const meta = {
  title: "Templates/WorkshopTeaserCard",
  component: WorkshopTeaserCard
} satisfies Meta<typeof WorkshopTeaserCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    action: <ActionControl label="Open workshop" />,
    content: (
      <WorkshopTeaserContent
        date="15 October"
        location="Berlin studio"
        summary="A hands-on session for learning practical service design techniques."
        title="Service Design Foundations"
      />
    )
  }
};
