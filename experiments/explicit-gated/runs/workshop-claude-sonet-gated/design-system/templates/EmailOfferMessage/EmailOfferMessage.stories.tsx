import type { Meta, StoryObj } from "@storybook/react";
import { EmailLinkControl } from "../../components/EmailLinkControl/EmailLinkControl";
import { EmailOfferContent } from "../../components/EmailOfferContent/EmailOfferContent";
import { EmailOfferMessage } from "./EmailOfferMessage";

const meta = {
  title: "Templates/EmailOfferMessage",
  component: EmailOfferMessage
} satisfies Meta<typeof EmailOfferMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OfferedPlace: Story = {
  args: {
    body: (
      <EmailOfferContent
        title="A place is available for you"
        message="Somebody cancelled, so the next place on the waitlist is yours."
        workshopTitle="Designing accessible workshops"
        expiresAt="9 March 2026, 17:00"
      />
    ),
    linkAction: (
      <EmailLinkControl label="Open offered place" href="https://example.org/offered-place/abc123" />
    )
  }
};
