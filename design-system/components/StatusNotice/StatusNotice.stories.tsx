import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusNotice } from "./StatusNotice";

const meta = {
  title: "Components/Status/StatusNotice",
  component: StatusNotice
} satisfies Meta<typeof StatusNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    message: "You are already on the waitlist for this workshop.",
    tone: "info"
  }
};

export const Success: Story = {
  args: {
    message: "You are already registered for this workshop.",
    tone: "success"
  }
};

export const Error: Story = {
  args: {
    message: "Registration for this workshop is closed.",
    tone: "error"
  }
};
