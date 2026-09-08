import { DetailWithAction } from "./DetailWithAction";
import { WorkshopDetailSummary } from "../../components/WorkshopDetailSummary/WorkshopDetailSummary";
import { ActionControl } from "../../components/ActionControl/ActionControl";

export default { title: "Templates/Detail With Action", component: DetailWithAction };

export const Basic = {
  render: () => (
    <DetailWithAction
      detailSummary={<WorkshopDetailSummary title="Data Storytelling" description="Turn data into clear, compelling stories." date="Wed, Jun 11, 2025" location="Virtual" availability="Limited · 6 / 20 spots" />}
      detailAction={<ActionControl label="Register" />}
    />
  )
};
