import { DescriptionList } from "../../primitives/DescriptionList/DescriptionList";
import { Panel } from "../../primitives/Panel/Panel";

export type WorkshopDetailSummaryProps = {
  availability: string;
  date: string;
  description: string;
  location: string;
  title: string;
};

export function WorkshopDetailSummary({
  availability,
  date,
  description,
  location,
  title
}: WorkshopDetailSummaryProps) {
  return (
    <Panel title={title}>
      <p>{description}</p>
      <DescriptionList
        terms={[
          { term: "Date", value: date },
          { term: "Location", value: location },
          { term: "Availability", value: availability }
        ]}
      />
    </Panel>
  );
}
