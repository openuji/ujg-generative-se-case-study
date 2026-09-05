import { DescriptionList } from "../../primitives/DescriptionList/DescriptionList";
import { IconSymbol } from "../../primitives/IconSymbol/IconSymbol";
import styles from "../../primitives/shared/SummaryContent.module.css";

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
    <section className={styles.root}>
      <IconSymbol name="user" />
      <h2>Review waitlist request</h2>
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
