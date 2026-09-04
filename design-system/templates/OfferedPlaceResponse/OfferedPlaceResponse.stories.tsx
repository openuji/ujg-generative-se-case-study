import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionControl } from "../../components/ActionControl/ActionControl";
import { OfferResponseSummary } from "../../components/OfferResponseSummary/OfferResponseSummary";
import { OfferedPlaceResponse } from "./OfferedPlaceResponse";

const meta = {
  title: "Templates/OfferedPlaceResponse",
  component: OfferedPlaceResponse
} satisfies Meta<typeof OfferedPlaceResponse>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    acceptAction: <ActionControl label="Accept place" />,
    declineAction: <ActionControl label="Decline place" />,
    summary: (
      <OfferResponseSummary
        expiresAt="18 October, 12:00"
        message="Review the available place and choose how to respond."
        title="Offered place"
        workshopTitle="Service Design Foundations"
      />
    )
  }
};
