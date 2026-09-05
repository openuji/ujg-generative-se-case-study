import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmailLinkControl } from "../../components/EmailLinkControl/EmailLinkControl";
import { EmailOfferContent } from "../../components/EmailOfferContent/EmailOfferContent";
import { EmailOfferMessage } from "./EmailOfferMessage";

const meta = {
  title: "Templates/EmailOfferMessage",
  component: EmailOfferMessage
} satisfies Meta<typeof EmailOfferMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    body: (
      <EmailOfferContent
        expiresAt="18 October, 12:00"
        message="A place has opened for you from the waitlist."
        title="A workshop place is available"
        workshopTitle="Service Design Foundations"
      />
    ),
    linkAction: <EmailLinkControl href="#" label="Open offered place" />
  }
};

export const Mobile: Story = {
  args: Default.args,
  parameters: {
    viewport: {
      defaultViewport: "ujgMobile"
    }
  }
};

export const Desktop: Story = {
  args: Default.args,
  parameters: {
    viewport: {
      defaultViewport: "ujgDesktop"
    }
  }
};
