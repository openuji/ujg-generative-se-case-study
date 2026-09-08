import { StatusWithAction } from "./StatusWithAction";
import { StatusMessage } from "../../components/StatusMessage/StatusMessage";
import { ActionControl } from "../../components/ActionControl/ActionControl";

export default { title: "Templates/Status With Action", component: StatusWithAction };

export const Basic = {
  render: () => (
    <StatusWithAction
      statusContent={<StatusMessage title="You are on the waitlist" message="We will notify you if a spot opens up." />}
      statusAction={<ActionControl label="Continue" />}
    />
  )
};
