import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionControl } from "../../components/ActionControl/ActionControl";
import { StatusMessage } from "../../components/StatusMessage/StatusMessage";
import { statusData } from "../../src/fixtures";
import { StatusWithAction } from "./StatusWithAction";

const meta = {
  title: "Templates/StatusWithAction",
  component: StatusWithAction
} satisfies Meta<typeof StatusWithAction>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Waitlisted: Story = {
  args: {
    statusContent: <StatusMessage {...statusData} title="Waitlisted" message="You have joined the waitlist." />,
    statusAction: <ActionControl label="Continue" />
  }
};
