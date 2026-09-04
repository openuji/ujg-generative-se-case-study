import type { ReactNode } from "react";

export type CollectionLayoutProps = {
  children: ReactNode;
  label?: string;
};

export function CollectionLayout({ children, label }: CollectionLayoutProps) {
  return (
    <section aria-label={label}>
      <div>{children}</div>
    </section>
  );
}
