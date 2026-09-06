import { DescriptionList } from "../../primitives/DescriptionList/DescriptionList";
import { IconSymbol } from "../../primitives/IconSymbol/IconSymbol";
import styles from "../../primitives/shared/SummaryContent.module.css";

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
    <article className={styles.root}>
      <IconSymbol name="mail" />
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
