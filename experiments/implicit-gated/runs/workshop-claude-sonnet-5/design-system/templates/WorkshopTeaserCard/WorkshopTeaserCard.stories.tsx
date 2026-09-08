import type { Meta, StoryObj } from "@storybook/react-vite";
import { WorkshopTeaserCard } from "./WorkshopTeaserCard";
import { WorkshopTeaserContent } from "../../components/WorkshopTeaserContent/WorkshopTeaserContent";
import { ActionControl } from "../../components/ActionControl/ActionControl";

const meta: Meta<typeof WorkshopTeaserCard> = {
  title: "Templates/WorkshopTeaserCard",
  component: WorkshopTeaserCard
};

export default meta;
type Story = StoryObj<typeof WorkshopTeaserCard>;

export const Default: Story = {
  args: {
    teaserContent: (
      <WorkshopTeaserContent
        title="Intro to Ceramics"
        summary="A hands-on afternoon session covering wheel-throwing basics."
        date="2026-10-04"
        location="Studio B, Riverside Arts Center"
      />
    ),
    teaserAction: <ActionControl label="Open workshop" />
  }
};
