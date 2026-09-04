import type { ReactNode } from "react";
import { Panel } from "../../primitives/Panel/Panel";

export type StatusWithActionProps = {
  action: ReactNode;
  status: ReactNode;
};

export function StatusWithAction({ action, status }: StatusWithActionProps) {
  return (
    <Panel actions={action}>
      {status}
    </Panel>
  );
}
