import { DescriptionList } from "../../primitives/DescriptionList/DescriptionList";
import { IconSymbol } from "../../primitives/IconSymbol/IconSymbol";
import styles from "../../primitives/shared/SummaryContent.module.css";

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
    <article className={styles.root}>
      <IconSymbol name="info" />
      <h2>{title}</h2>
      <p className={styles.intro}>{message}</p>
      <DescriptionList
        terms={[
          { icon: "workshop", term: "Workshop", value: workshopTitle },
          { icon: "clock", term: "Offer expires", value: expiresAt }
        ]}
      />
    </article>
  );
}
