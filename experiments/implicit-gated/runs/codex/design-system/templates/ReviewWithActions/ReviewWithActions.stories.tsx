import { ReviewWithActions } from "./ReviewWithActions";
import { RegistrationReviewSummary } from "../../components/RegistrationReviewSummary/RegistrationReviewSummary";
import { ActionControl } from "../../components/ActionControl/ActionControl";

export default { title: "Templates/Review With Actions", component: ReviewWithActions };

export const Basic = {
  render: () => (
    <ReviewWithActions
      reviewSummary={<RegistrationReviewSummary workshopTitle="Data Storytelling" name="Alex Morgan" email="alex.morgan@example.com" />}
      reviewEditAction={<ActionControl label="Edit details" variant="secondary" />}
      reviewSubmitAction={<ActionControl label="Confirm registration" />}
    />
  )
};
