import type { Meta, StoryObj } from "@storybook/react";
import { ActionControl } from "../../components/ActionControl/ActionControl";
import { OfferResponseSummary } from "../../components/OfferResponseSummary/OfferResponseSummary";
import { OfferedPlaceResponse } from "./OfferedPlaceResponse";

const meta = {
  title: "Templates/OfferedPlaceResponse",
  component: OfferedPlaceResponse
} satisfies Meta<typeof OfferedPlaceResponse>;

export default meta;

type Story = StoryObj<typeof meta>;

const openOffer = {
  summary: (
    <OfferResponseSummary
      title="Your offered place"
      message="Accept the place or decline it and stay on the waitlist."
      workshopTitle="Designing accessible workshops"
      expiresAt="9 March 2026, 17:00"
    />
  ),
  acceptAction: <ActionControl label="Accept offered place" />,
  declineAction: <ActionControl label="Decline offered place" variant="secondary" />
};

export const OpenOffer: Story = {
  args: openOffer
};

/** Stacked, full-width commands, accept first. */
export const OpenOfferOnMobile: Story = {
  args: openOffer,
  globals: { viewport: { value: "mobile" } }
};

/** Commands pair up under the centred offer from the small breakpoint upward. */
export const OpenOfferOnDesktop: Story = {
  args: openOffer,
  globals: { viewport: { value: "desktop" } }
};
