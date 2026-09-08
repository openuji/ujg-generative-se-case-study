import { OfferedPlaceResponse } from "./OfferedPlaceResponse";
import { OfferResponseSummary } from "../../components/OfferResponseSummary/OfferResponseSummary";
import { ActionControl } from "../../components/ActionControl/ActionControl";

export default { title: "Templates/Offered Place Response", component: OfferedPlaceResponse };

export const Basic = {
  render: () => (
    <OfferedPlaceResponse
      offerSummary={<OfferResponseSummary title="A spot is available for you" message="This offer is reserved for you temporarily." workshopTitle="Data Storytelling" expiresAt="Jun 14, 5:00 PM" />}
      offerAcceptAction={<ActionControl label="Accept spot" />}
      offerDeclineAction={<ActionControl label="Decline" variant="secondary" />}
    />
  )
};
