import { DescriptionList } from "../../primitives/DescriptionList/DescriptionList";
import { Panel } from "../../primitives/Panel/Panel";

export type WaitlistReviewSummaryProps = {
  email: string;
  name: string;
  workshopTitle: string;
};

export function WaitlistReviewSummary({
  email,
  name,
  workshopTitle
}: WaitlistReviewSummaryProps) {
  return (
    <Panel title="Review waitlist request">
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
