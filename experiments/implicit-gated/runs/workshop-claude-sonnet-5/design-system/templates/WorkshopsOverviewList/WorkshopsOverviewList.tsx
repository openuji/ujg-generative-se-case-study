import type { ReactNode } from "react";

export interface WorkshopsOverviewListProps {
  overviewWorkshops: ReactNode[];
}

export function WorkshopsOverviewList({ overviewWorkshops }: WorkshopsOverviewListProps) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {overviewWorkshops.map((workshop, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <li key={index}>{workshop}</li>
      ))}
    </ul>
  );
}
