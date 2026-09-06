import type { ReactNode } from "react";
import { CollectionLayout } from "../../primitives/CollectionLayout/CollectionLayout";

export type WorkshopsOverviewListProps = {
  workshops: ReactNode;
};

export function WorkshopsOverviewList({ workshops }: WorkshopsOverviewListProps) {
  return <CollectionLayout label="Workshops">{workshops}</CollectionLayout>;
}
