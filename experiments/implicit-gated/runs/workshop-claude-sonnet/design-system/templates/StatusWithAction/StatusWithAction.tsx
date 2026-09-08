import type { ReactNode } from "react";

export interface StatusWithActionProps {
  statusContent: ReactNode;
  statusAction: ReactNode;
}

export function StatusWithAction({ statusContent, statusAction }: StatusWithActionProps) {
  return (
    <section className="flex flex-col items-center gap-6 rounded-lg border border-line bg-raised p-6 text-center shadow-sm sm:p-8">
      {statusContent}
      <div>{statusAction}</div>
    </section>
  );
}
