import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionControl } from "../../components/ActionControl/ActionControl";
import { WorkshopTeaserContent } from "../../components/WorkshopTeaserContent/WorkshopTeaserContent";
import { WorkshopTeaserCard } from "../WorkshopTeaserCard/WorkshopTeaserCard";
import { teaserData } from "../../src/fixtures";
import { WorkshopsOverviewList } from "./WorkshopsOverviewList";

const meta = {
  title: "Templates/WorkshopsOverviewList",
  component: WorkshopsOverviewList
} satisfies Meta<typeof WorkshopsOverviewList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  args: {
    overviewWorkshops: (
      <>
        <WorkshopTeaserCard
          teaserContent={<WorkshopTeaserContent {...teaserData} />}
          teaserAction={<ActionControl label="Open" />}
        />
        <WorkshopTeaserCard
          teaserContent={
            <WorkshopTeaserContent
              title="Service Blueprinting"
              summary="A compact workshop for mapping service delivery gaps."
              date="October 21, 2026"
              location="Remote"
            />
          }
          teaserAction={<ActionControl label="Open" />}
        />
      </>
    )
  }
};
