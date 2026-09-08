export interface WorkshopTeaserContentProps {
  title: string;
  summary: string;
  date: string;
  location: string;
}

export function WorkshopTeaserContent({ title, summary, date, location }: WorkshopTeaserContentProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="text-sm text-ink-muted">{summary}</p>
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-muted">
        <span>{date}</span>
        <span>{location}</span>
      </p>
    </div>
  );
}
