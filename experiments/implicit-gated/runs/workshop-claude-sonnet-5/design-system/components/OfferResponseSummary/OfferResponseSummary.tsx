export interface OfferResponseSummaryProps {
  title: string;
  message: string;
  workshopTitle: string;
  expiresAt: string;
}

export function OfferResponseSummary({ title, message, workshopTitle, expiresAt }: OfferResponseSummaryProps) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <p className="text-ink-muted">{message}</p>
      <p className="font-medium text-ink">{workshopTitle}</p>
      <p className="text-sm text-ink-muted">Respond by {expiresAt}</p>
    </div>
  );
}
