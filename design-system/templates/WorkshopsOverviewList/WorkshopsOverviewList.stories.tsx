import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionControl } from "../../components/ActionControl/ActionControl";
import { WorkshopTeaserContent } from "../../components/WorkshopTeaserContent/WorkshopTeaserContent";
import { WorkshopTeaserCard } from "../WorkshopTeaserCard/WorkshopTeaserCard";
import { WorkshopsOverviewList } from "./WorkshopsOverviewList";

const meta = {
  title: "Templates/WorkshopsOverviewList",
  component: WorkshopsOverviewList,
  parameters: {
    ujgFrame: "list"
  }
} satisfies Meta<typeof WorkshopsOverviewList>;

export default meta;
type Story = StoryObj<typeof meta>;

const teaser = (
  <WorkshopTeaserCard
    action={<ActionControl label="Open workshop" />}
    content={
      <WorkshopTeaserContent
        date="15 October"
        location="Berlin studio"
        summary="A hands-on session for learning practical service design techniques."
        title="Service Design Foundations"
      />
    }
  />
);

export const MultipleOccurrences: Story = {
  args: {
    workshops: (
      <>
        {teaser}
        <WorkshopTeaserCard
          action={<ActionControl label="Open workshop" />}
          content={
            <WorkshopTeaserContent
              date="22 October"
              location="Remote"
              summary="A focused workshop for mapping service touchpoints."
              title="Journey Mapping Studio"
            />
          }
        />
      </>
    )
  }
};

export const Mobile: Story = {
  args: MultipleOccurrences.args,
  parameters: {
    viewport: {
      defaultViewport: "ujgMobile"
    }
  }
};

export const Desktop: Story = {
  args: MultipleOccurrences.args,
  parameters: {
    viewport: {
      defaultViewport: "ujgDesktop"
    }
  }
};
