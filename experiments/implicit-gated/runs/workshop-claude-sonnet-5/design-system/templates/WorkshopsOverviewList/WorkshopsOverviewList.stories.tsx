import type { Meta, StoryObj } from "@storybook/react-vite";
import { WorkshopsOverviewList } from "./WorkshopsOverviewList";
import { WorkshopTeaserCard } from "../WorkshopTeaserCard/WorkshopTeaserCard";
import { WorkshopTeaserContent } from "../../components/WorkshopTeaserContent/WorkshopTeaserContent";
import { ActionControl } from "../../components/ActionControl/ActionControl";

const meta: Meta<typeof WorkshopsOverviewList> = {
  title: "Templates/WorkshopsOverviewList",
  component: WorkshopsOverviewList
};

export default meta;
type Story = StoryObj<typeof WorkshopsOverviewList>;

const teaser = (title: string) => (
  <WorkshopTeaserCard
    teaserContent={
      <WorkshopTeaserContent
        title={title}
        summary="A hands-on session for all skill levels."
        date="2026-10-04"
        location="Studio B"
      />
    }
    teaserAction={<ActionControl label="Open workshop" />}
  />
);

export const Default: Story = {
  args: {
    overviewWorkshops: [teaser("Intro to Ceramics"), teaser("Watercolor Basics"), teaser("Letterpress Printing")]
  }
};

export const Mobile: Story = {
  args: Default.args,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 375 }}>
        <Story />
      </div>
    )
  ]
};

export const Desktop: Story = {
  args: Default.args,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 1024 }}>
        <Story />
      </div>
    )
  ]
};
