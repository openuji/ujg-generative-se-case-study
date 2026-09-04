import type { ReactNode } from "react";
import { Panel } from "../../primitives/Panel/Panel";

export type OfferedPlaceResponseProps = {
  acceptAction: ReactNode;
  declineAction: ReactNode;
  summary: ReactNode;
};

export function OfferedPlaceResponse({
  acceptAction,
  declineAction,
  summary
}: OfferedPlaceResponseProps) {
  return (
    <Panel
      actions={
        <>
          {acceptAction}
          {declineAction}
        </>
      }
    >
      {summary}
    </Panel>
  );
}
