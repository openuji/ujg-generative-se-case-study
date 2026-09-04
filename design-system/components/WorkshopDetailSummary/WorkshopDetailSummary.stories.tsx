import type { Meta, StoryObj } from "@storybook/react-vite";
import { WorkshopDetailSummary } from "./WorkshopDetailSummary";

const meta = {
  title: "Components/Workshop/WorkshopDetailSummary",
  component: WorkshopDetailSummary
} satisfies Meta<typeof WorkshopDetailSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RegistrationOpen: Story = {
  args: {
    availability: "Registration open",
    date: "15 October",
    description: "A practical workshop with exercises, review points, and guided facilitation.",
    location: "Berlin studio",
    title: "Service Design Foundations"
  }
};

export const WaitlistOpen: Story = {
  args: {
    availability: "Waitlist open",
    date: "15 October",
    description: "The workshop is currently full, but waitlist places can still be requested.",
    location: "Berlin studio",
    title: "Service Design Foundations"
  }
};
