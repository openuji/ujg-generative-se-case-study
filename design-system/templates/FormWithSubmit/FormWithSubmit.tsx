import type { ReactNode } from "react";
import { Panel } from "../../primitives/Panel/Panel";

export type FormWithSubmitProps = {
  fields: ReactNode;
  submitAction: ReactNode;
};

export function FormWithSubmit({ fields, submitAction }: FormWithSubmitProps) {
  return (
    <Panel>
      <form>
        {fields}
        <div>{submitAction}</div>
      </form>
    </Panel>
  );
}
