import type { ReactNode } from "react";
import { Panel } from "../../primitives/Panel/Panel";

export type WorkshopTeaserCardProps = {
  action: ReactNode;
  content: ReactNode;
};

export function WorkshopTeaserCard({ action, content }: WorkshopTeaserCardProps) {
  return (
    <Panel actions={action} as="article">
      {content}
    </Panel>
  );
}
