import type { ReactNode } from "react";
import { Panel } from "../../primitives/Panel/Panel";

export type DetailWithNoticeProps = {
  notice: ReactNode;
  summary: ReactNode;
};

export function DetailWithNotice({ notice, summary }: DetailWithNoticeProps) {
  return (
    <Panel>
      {summary}
      {notice}
    </Panel>
  );
}
