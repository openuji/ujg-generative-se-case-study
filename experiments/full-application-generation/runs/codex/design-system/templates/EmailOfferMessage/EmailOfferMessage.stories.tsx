import { EmailOfferMessage } from "./EmailOfferMessage";
import { OfferedPlaceEmailContent } from "../../components/OfferedPlaceEmailContent/OfferedPlaceEmailContent";
import { EmailLinkControl } from "../../components/EmailLinkControl/EmailLinkControl";

export default { title: "Templates/Email Offer Message", component: EmailOfferMessage };

export const Basic = {
  render: () => (
    <EmailOfferMessage
      emailBody={<OfferedPlaceEmailContent title="A spot is available for you" message="Someone cancelled and a spot is now available." workshopTitle="Data Storytelling" expiresAt="Jun 14, 5:00 PM" />}
      emailLinkAction={<EmailLinkControl label="Open offer" href="/offer/demo" />}
    />
  )
};
