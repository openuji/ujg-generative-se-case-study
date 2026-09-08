export interface ActionControlProps {
  label: string;
  onAction?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary";
  disabled?: boolean;
}

const VARIANT_CLASSES: Record<"primary" | "secondary", string> = {
  primary: "bg-action text-on-action hover:bg-action-hover",
  secondary: "border border-line-strong bg-raised text-ink hover:bg-canvas"
};

export function ActionControl({
  label,
  onAction,
  type = "button",
  variant = "primary",
  disabled
}: ActionControlProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${VARIANT_CLASSES[variant]}`}
      data-variant={variant}
      type={type}
      disabled={disabled}
      onClick={onAction}
    >
      {label}
    </button>
  );
}
