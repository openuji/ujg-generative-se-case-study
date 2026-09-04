import type { ElementType, ReactNode } from "react";

export type PanelProps = {
  actions?: ReactNode;
  as?: ElementType;
  children: ReactNode;
  title?: string;
};

export function Panel({ actions, as: Tag = "section", children, title }: PanelProps) {
  return (
    <Tag>
      {title ? (
        <header>
          <h2>{title}</h2>
        </header>
      ) : null}
      <div>{children}</div>
      {actions ? <footer>{actions}</footer> : null}
    </Tag>
  );
}
