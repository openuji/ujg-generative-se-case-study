import { DescriptionList } from "../../primitives/DescriptionList/DescriptionList";
import { IconSymbol } from "../../primitives/IconSymbol/IconSymbol";
import styles from "../../primitives/shared/SummaryContent.module.css";

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
    <section className={styles.root}>
      <IconSymbol name="user" />
      <h2>Review registration</h2>
      <DescriptionList
        terms={[
          { icon: "workshop", term: "Workshop", value: workshopTitle },
          { icon: "user", term: "Participant", value: name },
          { icon: "mail", term: "Email", value: email }
        ]}
      />
    </section>
  );
}
