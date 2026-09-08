import type { ReactNode } from "react";

export interface OfferedPlaceResponseProps {
  offerSummary: ReactNode;
  offerAcceptAction: ReactNode;
  offerDeclineAction: ReactNode;
}

export function OfferedPlaceResponse({
  offerSummary,
  offerAcceptAction,
  offerDeclineAction
}: OfferedPlaceResponseProps) {
  return (
    <section className="flex flex-col gap-6 rounded-lg border border-line bg-raised p-4 shadow-sm sm:p-6">
      {offerSummary}
      <div className="flex flex-col gap-3 sm:flex-row">
        {offerAcceptAction}
        {offerDeclineAction}
      </div>
    </section>
  );
}
