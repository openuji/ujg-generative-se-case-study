import type { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
}

export function Card({ children }: CardProps) {
  return <div className="rounded-lg border border-line bg-raised p-4 shadow-sm sm:p-6">{children}</div>;
}
