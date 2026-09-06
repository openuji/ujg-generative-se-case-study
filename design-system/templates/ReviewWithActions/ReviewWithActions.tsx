import type { ReactNode } from "react";
import { Panel } from "../../primitives/Panel/Panel";

export type ReviewWithActionsProps = {
  editAction: ReactNode;
  submitAction: ReactNode;
  summary: ReactNode;
};

export function ReviewWithActions({
  editAction,
  submitAction,
  summary
}: ReviewWithActionsProps) {
  return (
    <Panel
      actions={
        <>
          {editAction}
          {submitAction}
        </>
      }
    >
      {summary}
    </Panel>
  );
}
