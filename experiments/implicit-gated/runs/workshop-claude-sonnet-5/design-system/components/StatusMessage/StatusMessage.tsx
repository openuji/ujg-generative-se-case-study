import { Badge, type BadgeTone } from "../../primitives/Badge/Badge";
import { DefinitionList, type DefinitionListItem } from "../../primitives/DefinitionList/DefinitionList";

export interface StatusMessageProps {
  title: string;
  message: string;
  tone?: BadgeTone;
  details?: DefinitionListItem[];
}

export function StatusMessage({ title, message, tone, details }: StatusMessageProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {tone ? <Badge tone={tone}>{tone}</Badge> : undefined}
      <h2 className="text-2xl font-semibold text-ink">{title}</h2>
      <p className="text-ink-muted">{message}</p>
      {details && details.length > 0 ? (
        <div className="w-full max-w-xs text-left">
          <DefinitionList items={details} />
        </div>
      ) : undefined}
    </div>
  );
}
