import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusMessage } from "./StatusMessage";

const meta = {
  title: "Components/Status/StatusMessage",
  component: StatusMessage
} satisfies Meta<typeof StatusMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Confirmed: Story = {
  args: {
    details: [{ term: "Workshop", value: "Service Design Foundations" }],
    message: "Your place has been confirmed.",
    title: "Registration confirmed"
  }
};

export const Waitlisted: Story = {
  args: {
    message: "You remain on the waitlist for this workshop.",
    title: "Waitlisted"
  }
};
