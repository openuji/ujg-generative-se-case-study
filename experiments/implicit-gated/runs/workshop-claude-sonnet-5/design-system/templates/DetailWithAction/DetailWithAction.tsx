import type { ReactNode } from "react";

export interface DetailWithActionProps {
  detailSummary: ReactNode;
  detailAction: ReactNode;
}

export function DetailWithAction({ detailSummary, detailAction }: DetailWithActionProps) {
  return (
    <section className="flex flex-col gap-6 rounded-lg border border-line bg-raised p-4 shadow-sm sm:p-6">
      {detailSummary}
      <div>{detailAction}</div>
    </section>
  );
}
