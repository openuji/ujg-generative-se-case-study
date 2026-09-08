import type { Meta, StoryObj } from "@storybook/react";
import { DetailList } from "./DetailList";

const meta = {
  title: "Primitives/DetailList",
  component: DetailList
} satisfies Meta<typeof DetailList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Entries: Story = {
  args: {
    entries: [
      { term: "Date", value: "12 March 2026, 09:30" },
      { term: "Location", value: "Studio 2, Rotterdam" }
    ]
  }
};

export const SingleEntry: Story = {
  args: {
    entries: [{ term: "Availability", value: "4 places left" }]
  }
};

/** Term over value: the base layout the primitive starts from. */
export const EntriesOnMobile: Story = {
  args: {
    entries: [
      { term: "Date", value: "12 March 2026, 09:30" },
      { term: "Location", value: "Studio 2, Rotterdam" },
      { term: "Availability", value: "4 places left" }
    ]
  },
  globals: { viewport: { value: "mobile" } }
};

/** Term beside value from the shared small breakpoint upward. */
export const EntriesOnDesktop: Story = {
  args: {
    entries: [
      { term: "Date", value: "12 March 2026, 09:30" },
      { term: "Location", value: "Studio 2, Rotterdam" },
      { term: "Availability", value: "4 places left" }
    ]
  },
  globals: { viewport: { value: "desktop" } }
};
