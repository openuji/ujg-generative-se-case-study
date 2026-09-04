import { DescriptionList } from "../../primitives/DescriptionList/DescriptionList";
import { Panel } from "../../primitives/Panel/Panel";

export type RegistrationReviewSummaryProps = {
  email: string;
  name: string;
  workshopTitle: string;
};

export function RegistrationReviewSummary({
  email,
  name,
  workshopTitle
}: RegistrationReviewSummaryProps) {
  return (
    <Panel title="Review registration">
      <DescriptionList
        terms={[
          { term: "Workshop", value: workshopTitle },
          { term: "Participant", value: name },
          { term: "Email", value: email }
        ]}
      />
    </Panel>
  );
}
