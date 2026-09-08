import type { Meta, StoryObj } from "@storybook/react-vite";
import { OfferedPlaceResponse } from "./OfferedPlaceResponse";
import { OfferResponseSummary } from "../../components/OfferResponseSummary/OfferResponseSummary";
import { ActionControl } from "../../components/ActionControl/ActionControl";

const meta: Meta<typeof OfferedPlaceResponse> = {
  title: "Templates/OfferedPlaceResponse",
  component: OfferedPlaceResponse
};

export default meta;
type Story = StoryObj<typeof OfferedPlaceResponse>;

export const Default: Story = {
  args: {
    offerSummary: (
      <OfferResponseSummary
        title="A place is available"
        message="Accept within 48 hours to keep your place."
        workshopTitle="Intro to Ceramics"
        expiresAt="2026-10-01T18:00:00Z"
      />
    ),
    offerAcceptAction: <ActionControl label="Accept place" />,
    offerDeclineAction: <ActionControl label="Decline" variant="secondary" />
  }
};
