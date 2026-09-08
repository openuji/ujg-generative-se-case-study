import { WorkshopsOverviewList } from "./WorkshopsOverviewList";
import { WorkshopTeaserCard } from "../WorkshopTeaserCard/WorkshopTeaserCard";
import { WorkshopTeaserContent } from "../../components/WorkshopTeaserContent/WorkshopTeaserContent";
import { ActionControl } from "../../components/ActionControl/ActionControl";

export default { title: "Templates/Workshops Overview List", component: WorkshopsOverviewList };

export const Basic = {
  render: () => (
    <WorkshopsOverviewList
      overviewWorkshops={[
        "Data Storytelling",
        "Sustainable Living Basics"
      ].map((title) => (
        <WorkshopTeaserCard
          key={title}
          teaserContent={<WorkshopTeaserContent title={title} summary="A focused practical workshop." date="Wed, Jun 11, 2025" location="Virtual" />}
          teaserAction={<ActionControl label="View workshop" />}
        />
      ))}
      sidebar={<p>Two upcoming registrations</p>}
    />
  )
};
