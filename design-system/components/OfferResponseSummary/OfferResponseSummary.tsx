import { DescriptionList } from "../../primitives/DescriptionList/DescriptionList";
import { Panel } from "../../primitives/Panel/Panel";

export type OfferResponseSummaryProps = {
  expiresAt: string;
  message: string;
  title: string;
  workshopTitle: string;
};

export function OfferResponseSummary({
  expiresAt,
  message,
  title,
  workshopTitle
}: OfferResponseSummaryProps) {
  return (
    <Panel title={title}>
      <p>{message}</p>
      <DescriptionList
        terms={[
          { term: "Workshop", value: workshopTitle },
          { term: "Offer expires", value: expiresAt }
        ]}
      />
    </Panel>
  );
}
