import type { MouseEventHandler, ReactNode } from "react";

export type ActionButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  type?: "button" | "submit";
};

export function ActionButton({
  children,
  disabled = false,
  href,
  onClick,
  type = "button"
}: ActionButtonProps) {
  if (href) {
    return (
      <a aria-disabled={disabled} href={disabled ? undefined : href} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <button disabled={disabled} onClick={onClick} type={type}>
      {children}
    </button>
  );
}
