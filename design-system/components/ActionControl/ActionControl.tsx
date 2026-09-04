import type { MouseEventHandler } from "react";
import { ActionButton } from "../../primitives/ActionButton/ActionButton";

export type ActionControlProps = {
  disabled?: boolean;
  label: string;
  onAction?: MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit";
};

export function ActionControl({
  disabled = false,
  label,
  onAction,
  type = "button"
}: ActionControlProps) {
  return (
    <ActionButton disabled={disabled} onClick={onAction} type={type}>
      {label}
    </ActionButton>
  );
}
