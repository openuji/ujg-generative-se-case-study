import type { Meta, StoryObj } from "@storybook/react";
import { WorkshopDetailSummary } from "./WorkshopDetailSummary";

const meta = {
  title: "Components/WorkshopDetailSummary",
  component: WorkshopDetailSummary
} satisfies Meta<typeof WorkshopDetailSummary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PlacesAvailable: Story = {
  args: {
    title: "Designing accessible workshops",
    description: "A full-day, hands-on session about inclusive facilitation and materials.",
    date: "12 March 2026, 09:30",
    location: "Studio 2, Rotterdam",
    availability: "4 places left"
  }
};

export const NoPlacesLeft: Story = {
  args: {
    title: "Designing accessible workshops",
    description: "A full-day, hands-on session about inclusive facilitation and materials.",
    date: "12 March 2026, 09:30",
    location: "Studio 2, Rotterdam",
    availability: "Fully booked"
  }
};

/** The display title steps down a size below the shared medium breakpoint. */
export const PlacesAvailableOnMobile: Story = {
  args: {
    title: "Designing accessible workshops",
    description: "A full-day, hands-on session about inclusive facilitation and materials.",
    date: "12 March 2026, 09:30",
    location: "Studio 2, Rotterdam",
    availability: "4 places left"
  },
  globals: { viewport: { value: "mobile" } }
};

export const PlacesAvailableOnDesktop: Story = {
  args: {
    title: "Designing accessible workshops",
    description: "A full-day, hands-on session about inclusive facilitation and materials.",
    date: "12 March 2026, 09:30",
    location: "Studio 2, Rotterdam",
    availability: "4 places left"
  },
  globals: { viewport: { value: "desktop" } }
};
