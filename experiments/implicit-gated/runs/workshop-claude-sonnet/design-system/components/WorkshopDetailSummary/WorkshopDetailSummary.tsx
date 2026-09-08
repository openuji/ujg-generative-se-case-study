import { Badge } from "../../primitives/Badge/Badge";

export interface WorkshopDetailSummaryProps {
  title: string;
  description: string;
  date: string;
  location: string;
  availability: string;
}

export function WorkshopDetailSummary({
  title,
  description,
  date,
  location,
  availability
}: WorkshopDetailSummaryProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold text-ink sm:text-2xl">{title}</h2>
        <Badge tone="info">{availability}</Badge>
      </div>
      <p className="text-sm text-ink-muted sm:text-base">{description}</p>
      <dl className="flex flex-col gap-1 text-sm text-ink-muted sm:flex-row sm:gap-6">
        <div className="flex gap-1">
          <dt className="font-medium text-ink">Date</dt>
          <dd>{date}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="font-medium text-ink">Location</dt>
          <dd>{location}</dd>
        </div>
      </dl>
    </div>
  );
}
