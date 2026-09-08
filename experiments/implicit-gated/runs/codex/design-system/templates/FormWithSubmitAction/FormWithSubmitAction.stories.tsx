import { FormWithSubmitAction } from "./FormWithSubmitAction";
import { RegistrationFormFields } from "../../components/RegistrationFormFields/RegistrationFormFields";
import { ActionControl } from "../../components/ActionControl/ActionControl";

export default { title: "Templates/Form With Submit Action", component: FormWithSubmitAction };

export const Basic = {
  render: () => (
    <FormWithSubmitAction
      formFields={<RegistrationFormFields name="Alex Morgan" email="alex.morgan@example.com" />}
      formSubmitAction={<ActionControl label="Continue" type="submit" />}
    />
  )
};
