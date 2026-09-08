import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusWithAction } from "./StatusWithAction";
import { StatusMessage } from "../../components/StatusMessage/StatusMessage";
import { ActionControl } from "../../components/ActionControl/ActionControl";

const meta: Meta<typeof StatusWithAction> = {
  title: "Templates/StatusWithAction",
  component: StatusWithAction
};

export default meta;
type Story = StoryObj<typeof StatusWithAction>;

export const AlreadyWaitlisted: Story = {
  args: {
    statusContent: (
      <StatusMessage
        title="You're already waitlisted"
        message="You're already on the waitlist for this workshop."
        tone="info"
      />
    ),
    statusAction: <ActionControl label="Continue" />
  }
};
