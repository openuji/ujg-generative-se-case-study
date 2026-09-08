import type { ReactNode } from "react";

export interface DetailWithNoticeProps {
  detailSummary: ReactNode;
  detailNotice: ReactNode;
}

export function DetailWithNotice({ detailSummary, detailNotice }: DetailWithNoticeProps) {
  return (
    <section className="flex flex-col gap-6 rounded-lg border border-line bg-raised p-4 shadow-sm sm:p-6">
      {detailSummary}
      <div>{detailNotice}</div>
    </section>
  );
}
