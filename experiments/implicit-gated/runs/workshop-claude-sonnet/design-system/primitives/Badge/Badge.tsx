import type { ReactNode } from "react";

export type BadgeTone = "error" | "info" | "success" | "warning";

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  error: "bg-error text-error-ink",
  info: "bg-info text-info-ink",
  success: "bg-success text-success-ink",
  warning: "bg-warning text-warning-ink"
};

export function Badge({ tone = "info", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
      data-tone={tone}
    >
      {children}
    </span>
  );
}
