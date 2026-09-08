import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionControl } from "../../components/ActionControl/ActionControl";
import { OfferResponseSummary } from "../../components/OfferResponseSummary/OfferResponseSummary";
import { offerData } from "../../src/fixtures";
import { OfferedPlaceResponse } from "./OfferedPlaceResponse";

const meta = {
  title: "Templates/OfferedPlaceResponse",
  component: OfferedPlaceResponse
} satisfies Meta<typeof OfferedPlaceResponse>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AvailableOffer: Story = {
  args: {
    offerSummary: <OfferResponseSummary {...offerData} />,
    offerAcceptAction: <ActionControl label="Accept place" />,
    offerDeclineAction: <ActionControl label="Decline" />
  }
};
