import type { MouseEventHandler } from "react";
import { ActionButton } from "../../primitives/ActionButton/ActionButton";

export type EmailLinkControlProps = {
  disabled?: boolean;
  href: string;
  label: string;
  onAction?: MouseEventHandler<HTMLAnchorElement>;
};

export function EmailLinkControl({
  disabled = false,
  href,
  label,
  onAction
}: EmailLinkControlProps) {
  return (
    <ActionButton disabled={disabled} href={href} onClick={onAction}>
      {label}
    </ActionButton>
  );
}
