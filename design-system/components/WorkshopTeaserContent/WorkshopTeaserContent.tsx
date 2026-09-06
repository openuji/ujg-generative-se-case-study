import { DescriptionList } from "../../primitives/DescriptionList/DescriptionList";
import { IconSymbol } from "../../primitives/IconSymbol/IconSymbol";
import styles from "../../primitives/shared/SummaryContent.module.css";

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
    <article className={styles.root}>
      <IconSymbol name="workshop" />
      <h2>{title}</h2>
      <p className={styles.intro}>{summary}</p>
      <DescriptionList
        terms={[
          { icon: "calendar", term: "Date", value: date },
          { icon: "map-pin", term: "Location", value: location }
        ]}
      />
    </article>
  );
}
