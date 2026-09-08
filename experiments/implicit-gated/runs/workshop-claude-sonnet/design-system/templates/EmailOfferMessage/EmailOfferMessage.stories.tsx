import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmailOfferMessage } from "./EmailOfferMessage";
import { EmailOfferContent } from "../../components/EmailOfferContent/EmailOfferContent";
import { EmailLinkControl } from "../../components/EmailLinkControl/EmailLinkControl";

const meta: Meta<typeof EmailOfferMessage> = {
  title: "Templates/EmailOfferMessage",
  component: EmailOfferMessage
};

export default meta;
type Story = StoryObj<typeof EmailOfferMessage>;

export const Default: Story = {
  args: {
    emailBody: (
      <EmailOfferContent
        title="A place opened up"
        message="A registration place for Intro to Ceramics has become available for you."
        workshopTitle="Intro to Ceramics"
        expiresAt="2026-10-01T18:00:00Z"
      />
    ),
    emailLinkAction: (
      <EmailLinkControl label="View your offer" href="https://workshops.example.com/offers/abc123" />
    )
  }
};
