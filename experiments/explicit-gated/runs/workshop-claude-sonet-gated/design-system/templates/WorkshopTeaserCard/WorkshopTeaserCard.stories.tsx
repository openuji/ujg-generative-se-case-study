import type { Meta, StoryObj } from "@storybook/react";
import { ActionControl } from "../../components/ActionControl/ActionControl";
import { WorkshopTeaserContent } from "../../components/WorkshopTeaserContent/WorkshopTeaserContent";
import { WorkshopTeaserCard } from "./WorkshopTeaserCard";

const meta = {
  title: "Templates/WorkshopTeaserCard",
  component: WorkshopTeaserCard
} satisfies Meta<typeof WorkshopTeaserCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Teaser: Story = {
  args: {
    content: (
      <WorkshopTeaserContent
        title="Designing accessible workshops"
        summary="A hands-on session about inclusive facilitation."
        date="12 March 2026, 09:30"
        location="Studio 2, Rotterdam"
      />
    ),
    action: <ActionControl label="Open workshop" />
  }
};
