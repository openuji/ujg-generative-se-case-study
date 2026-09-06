import { DescriptionList } from "../../primitives/DescriptionList/DescriptionList";
import { IconSymbol } from "../../primitives/IconSymbol/IconSymbol";
import { StatusBadge, type StatusBadgeTone } from "../../primitives/StatusBadge/StatusBadge";
import styles from "../../primitives/shared/SummaryContent.module.css";

export type WorkshopDetailSummaryProps = {
  availability: string;
  date: string;
  description: string;
  location: string;
  title: string;
};

function availabilityTone(availability: string): StatusBadgeTone {
  const normalizedAvailability = availability.toLowerCase();

  if (normalizedAvailability.includes("waitlist")) {
    return "info";
  }

  if (normalizedAvailability.includes("closed") || normalizedAvailability.includes("unavailable")) {
    return "error";
  }

  if (normalizedAvailability.includes("limited")) {
    return "warning";
  }

  return "success";
}

export function WorkshopDetailSummary({
  availability,
  date,
  description,
  location,
  title
}: WorkshopDetailSummaryProps) {
  return (
    <article className={styles.root}>
      <IconSymbol name="workshop" />
      <h2>{title}</h2>
      <p className={styles.intro}>{description}</p>
      <DescriptionList
        terms={[
          { icon: "calendar", term: "Date", value: date },
          { icon: "map-pin", term: "Location", value: location },
          {
            icon: "info",
            term: "Availability",
            value: <StatusBadge tone={availabilityTone(availability)}>{availability}</StatusBadge>
          }
        ]}
      />
    </article>
  );
}
