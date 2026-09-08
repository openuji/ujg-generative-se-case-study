import { Badge, type BadgeTone } from "../../primitives/Badge/Badge";

export interface StatusNoticeProps {
  message: string;
  tone?: BadgeTone;
}

export function StatusNotice({ message, tone = "info" }: StatusNoticeProps) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-line bg-canvas px-3 py-2 text-sm">
      <Badge tone={tone}>{tone}</Badge>
      <p className="text-ink">{message}</p>
    </div>
  );
}
