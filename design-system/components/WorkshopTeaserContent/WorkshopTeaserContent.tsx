import { DescriptionList } from "../../primitives/DescriptionList/DescriptionList";
import { Panel } from "../../primitives/Panel/Panel";

export type WorkshopTeaserContentProps = {
  date: string;
  location: string;
  summary: string;
  title: string;
};

export function WorkshopTeaserContent({
  date,
  location,
  summary,
  title
}: WorkshopTeaserContentProps) {
  return (
    <Panel as="article" title={title}>
      <p>{summary}</p>
      <DescriptionList
        terms={[
          { term: "Date", value: date },
          { term: "Location", value: location }
        ]}
      />
    </Panel>
  );
}
