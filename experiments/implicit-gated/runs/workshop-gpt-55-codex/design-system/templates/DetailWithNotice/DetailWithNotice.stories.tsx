import { DetailWithNotice } from "./DetailWithNotice";
import { WorkshopDetailSummary } from "../../components/WorkshopDetailSummary/WorkshopDetailSummary";
import { StatusNotice } from "../../components/StatusNotice/StatusNotice";

export default { title: "Templates/Detail With Notice", component: DetailWithNotice };

export const Basic = {
  render: () => (
    <DetailWithNotice
      detailSummary={<WorkshopDetailSummary title="Data Storytelling" description="Turn data into clear, compelling stories." date="Wed, Jun 11, 2025" location="Virtual" availability="Registered" />}
      detailNotice={<StatusNotice tone="success" message="You are already registered for this workshop." />}
    />
  )
};
