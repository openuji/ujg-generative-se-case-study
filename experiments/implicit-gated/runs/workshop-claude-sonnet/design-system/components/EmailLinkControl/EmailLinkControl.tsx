export interface EmailLinkControlProps {
  label: string;
  href: string;
}

export function EmailLinkControl({ label, href }: EmailLinkControlProps) {
  return (
    <a
      className="inline-flex items-center justify-center gap-2 rounded-md bg-action px-4 py-2 text-sm font-medium text-on-action hover:bg-action-hover"
      href={href}
    >
      {label}
    </a>
  );
}
