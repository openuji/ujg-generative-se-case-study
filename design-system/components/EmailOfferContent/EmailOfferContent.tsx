import { DescriptionList } from "../../primitives/DescriptionList/DescriptionList";
import { Panel } from "../../primitives/Panel/Panel";

export type EmailOfferContentProps = {
  expiresAt: string;
  message: string;
  title: string;
  workshopTitle: string;
};

export function EmailOfferContent({
  expiresAt,
  message,
  title,
  workshopTitle
}: EmailOfferContentProps) {
  return (
    <Panel as="article" title={title}>
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
