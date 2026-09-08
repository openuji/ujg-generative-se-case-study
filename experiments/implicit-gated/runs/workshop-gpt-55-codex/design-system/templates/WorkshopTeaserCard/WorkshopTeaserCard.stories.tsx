import { WorkshopTeaserCard } from "./WorkshopTeaserCard";
import { WorkshopTeaserContent } from "../../components/WorkshopTeaserContent/WorkshopTeaserContent";
import { ActionControl } from "../../components/ActionControl/ActionControl";

export default { title: "Templates/Workshop Teaser Card", component: WorkshopTeaserCard };

export const Basic = {
  render: () => (
    <WorkshopTeaserCard
      teaserContent={<WorkshopTeaserContent title="Data Storytelling" summary="Turn data into clear, compelling stories." date="Wed, Jun 11, 2025" location="Virtual" />}
      teaserAction={<ActionControl label="View workshop" />}
    />
  )
};
