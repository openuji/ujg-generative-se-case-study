import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionControl } from "../../components/ActionControl/ActionControl";
import { StatusMessage } from "../../components/StatusMessage/StatusMessage";
import { StatusWithAction } from "./StatusWithAction";

const meta = {
  title: "Templates/StatusWithAction",
  component: StatusWithAction
} satisfies Meta<typeof StatusWithAction>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AlreadyWaitlisted: Story = {
  args: {
    action: <ActionControl label="Continue" />,
    status: (
      <StatusMessage
        message="This email address is already on the waitlist for this workshop."
        title="Already waitlisted"
      />
    )
  }
};
