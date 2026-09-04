import { DescriptionList, type DescriptionTerm } from "../../primitives/DescriptionList/DescriptionList";
import { Panel } from "../../primitives/Panel/Panel";

export type StatusMessageProps = {
  details?: DescriptionTerm[];
  message: string;
  title: string;
};

export function StatusMessage({ details = [], message, title }: StatusMessageProps) {
  return (
    <Panel title={title}>
      <p>{message}</p>
      {details.length > 0 ? <DescriptionList terms={details} /> : null}
    </Panel>
  );
}
