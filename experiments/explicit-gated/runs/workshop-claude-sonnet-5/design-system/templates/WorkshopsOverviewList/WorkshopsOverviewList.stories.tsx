import type { Meta, StoryObj } from "@storybook/react";
import { ActionControl } from "../../components/ActionControl/ActionControl";
import { WorkshopTeaserContent } from "../../components/WorkshopTeaserContent/WorkshopTeaserContent";
import { WorkshopTeaserCard } from "../WorkshopTeaserCard/WorkshopTeaserCard";
import { WorkshopsOverviewList } from "./WorkshopsOverviewList";

const meta = {
  title: "Templates/WorkshopsOverviewList",
  component: WorkshopsOverviewList
} satisfies Meta<typeof WorkshopsOverviewList>;

export default meta;

type Story = StoryObj<typeof meta>;

const teasers = [
  {
    title: "Designing accessible workshops",
    summary: "A hands-on session about inclusive facilitation.",
    date: "12 March 2026, 09:30",
    location: "Studio 2, Rotterdam"
  },
  {
    title: "Facilitating difficult conversations",
    summary: "Practise structures for high-tension group sessions.",
    date: "26 March 2026, 13:00",
    location: "Studio 1, Rotterdam"
  },
  {
    title: "Writing plain-language invitations",
    summary: "Turn dense programme copy into readable invitations.",
    date: "9 April 2026, 09:30",
    location: "Online"
  }
];

const overview = teasers.map((teaser) => (
  <WorkshopTeaserCard
    content={<WorkshopTeaserContent {...teaser} />}
    action={<ActionControl label="Open workshop" variant="secondary" />}
  />
));

/**
 * The overview slot receives one realized teaser per workshop. The repetition
 * lives in this fixture, not in the template or in a content component.
 */
export const Overview: Story = {
  args: {
    workshops: overview
  }
};

/** One column: the base layout the template starts from. */
export const OverviewOnMobile: Story = {
  args: { workshops: overview },
  globals: { viewport: { value: "mobile" } }
};

/** Two columns from the shared medium breakpoint upward. */
export const OverviewOnDesktop: Story = {
  args: { workshops: overview },
  globals: { viewport: { value: "desktop" } }
};

export const SingleWorkshop: Story = {
  args: {
    workshops: [
      <WorkshopTeaserCard
        content={<WorkshopTeaserContent {...teasers[0]!} />}
        action={<ActionControl label="Open workshop" variant="secondary" />}
      />
    ]
  }
};
