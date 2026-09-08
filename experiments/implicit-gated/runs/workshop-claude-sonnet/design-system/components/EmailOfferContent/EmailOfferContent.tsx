export interface EmailOfferContentProps {
  title: string;
  message: string;
  workshopTitle: string;
  expiresAt: string;
}

export function EmailOfferContent({ title, message, workshopTitle, expiresAt }: EmailOfferContentProps) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-semibold text-ink">{title}</h1>
      <p className="text-ink-muted">{message}</p>
      <p className="font-medium text-ink">{workshopTitle}</p>
      <p className="text-sm text-ink-muted">Offer expires {expiresAt}</p>
    </div>
  );
}
