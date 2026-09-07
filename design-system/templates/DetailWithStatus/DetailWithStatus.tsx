import type { ReactNode } from "react";
import { Panel } from "../../primitives/Panel/Panel";

export type DetailWithStatusProps = {
  status: ReactNode;
  summary: ReactNode;
};

export function DetailWithStatus({ status, summary }: DetailWithStatusProps) {
  return (
    <Panel>
      {status}
      {summary}      
    </Panel>
  );
}
