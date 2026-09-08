import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusNotice } from "./StatusNotice";

const meta: Meta<typeof StatusNotice> = {
  title: "Components/StatusNotice",
  component: StatusNotice
};

export default meta;
type Story = StoryObj<typeof StatusNotice>;

export const AlreadyRegistered: Story = {
  args: {
    message: "You're already registered for this workshop.",
    tone: "info"
  }
};
