import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmailLinkControl } from "../../components/EmailLinkControl/EmailLinkControl";
import { EmailOfferContent } from "../../components/EmailOfferContent/EmailOfferContent";
import { offerData } from "../../src/fixtures";
import { EmailOfferMessage } from "./EmailOfferMessage";

const meta = {
  title: "Templates/EmailOfferMessage",
  component: EmailOfferMessage
} satisfies Meta<typeof EmailOfferMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OfferEmail: Story = {
  args: {
    emailBody: <EmailOfferContent {...offerData} />,
    emailLinkAction: <EmailLinkControl href="https://example.com/offer" label="Open offer" />
  }
};
