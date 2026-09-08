import type { Meta, StoryObj } from "@storybook/react-vite";
import { offerData } from "../../src/fixtures";
import { OfferResponseSummary } from "./OfferResponseSummary";

const meta = {
  title: "Components/OfferResponseSummary",
  component: OfferResponseSummary
} satisfies Meta<typeof OfferResponseSummary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Summary: Story = {
  args: offerData
};
