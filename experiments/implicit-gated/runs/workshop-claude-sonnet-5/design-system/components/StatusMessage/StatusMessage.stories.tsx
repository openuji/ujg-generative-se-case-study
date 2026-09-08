import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusMessage } from "./StatusMessage";

const meta: Meta<typeof StatusMessage> = {
  title: "Components/StatusMessage",
  component: StatusMessage
};

export default meta;
type Story = StoryObj<typeof StatusMessage>;

export const Confirmed: Story = {
  args: {
    title: "Registration confirmed",
    message: "You're registered for Intro to Ceramics.",
    tone: "success",
    details: [
      { term: "Workshop", value: "Intro to Ceramics" },
      { term: "Date", value: "2026-10-04" }
    ]
  }
};

export const Closed: Story = {
  args: {
    title: "Registration closed",
    message: "This workshop is no longer accepting registrations.",
    tone: "warning"
  }
};
