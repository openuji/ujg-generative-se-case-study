import { StatusNotice } from "./StatusNotice";

export default { title: "Components/Status Notice", component: StatusNotice };

export const Warning = {
  args: {
    message: "You are already on the waitlist for this workshop.",
    tone: "warning"
  }
};
