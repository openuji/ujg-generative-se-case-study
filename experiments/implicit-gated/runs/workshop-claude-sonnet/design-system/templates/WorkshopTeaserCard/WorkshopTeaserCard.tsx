import type { ReactNode } from "react";

export interface WorkshopTeaserCardProps {
  teaserContent: ReactNode;
  teaserAction: ReactNode;
}

export function WorkshopTeaserCard({ teaserContent, teaserAction }: WorkshopTeaserCardProps) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-lg border border-line bg-raised p-4 shadow-sm sm:p-6">
      {teaserContent}
      <div className="mt-auto">{teaserAction}</div>
    </article>
  );
}
