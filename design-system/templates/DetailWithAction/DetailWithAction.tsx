import type { ReactNode } from "react";
import { Panel } from "../../primitives/Panel/Panel";

export type DetailWithActionProps = {
  action: ReactNode;
  summary: ReactNode;
};

export function DetailWithAction({ action, summary }: DetailWithActionProps) {
  return (
    <Panel actions={action}>
      {summary}
    </Panel>
  );
}
