import { StatusMessage } from "./StatusMessage";

export default { title: "Components/Status Message", component: StatusMessage };

export const Success = {
  args: {
    title: "You are registered",
    message: "Your spot has been secured.",
    tone: "success",
    details: [{ term: "Workshop", value: "Data Storytelling" }]
  }
};
