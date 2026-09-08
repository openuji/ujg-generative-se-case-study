import type { Meta, StoryObj } from "@storybook/react-vite";
import { offerData } from "../../src/fixtures";
import { EmailOfferContent } from "./EmailOfferContent";

const meta = {
  title: "Components/EmailOfferContent",
  component: EmailOfferContent
} satisfies Meta<typeof EmailOfferContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Message: Story = {
  args: offerData
};
