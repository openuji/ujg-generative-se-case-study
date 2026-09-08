import type { ReactNode } from "react";

export interface ReviewWithActionsProps {
  reviewSummary: ReactNode;
  reviewEditAction: ReactNode;
  reviewSubmitAction: ReactNode;
}

export function ReviewWithActions({ reviewSummary, reviewEditAction, reviewSubmitAction }: ReviewWithActionsProps) {
  return (
    <section className="flex flex-col gap-6 rounded-lg border border-line bg-raised p-4 shadow-sm sm:p-6">
      {reviewSummary}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {reviewEditAction}
        {reviewSubmitAction}
      </div>
    </section>
  );
}
