import type { ReactNode } from "react";
import { Panel } from "../../primitives/Panel/Panel";

export type EmailOfferMessageProps = {
  body: ReactNode;
  linkAction: ReactNode;
};

export function EmailOfferMessage({ body, linkAction }: EmailOfferMessageProps) {
  return (
    <Panel actions={linkAction} as="article">
      {body}
    </Panel>
  );
}
