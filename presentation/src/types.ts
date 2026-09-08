import type { ReactNode } from "react";

export type DeckRenderContext = {
  revealStep: number;
};

export type DeckContent =
  | ReactNode
  | ((context: DeckRenderContext) => ReactNode);

export type ModelResult = {
  model: string;
  status: "running" | "finished" | "failed";
  qualityScore?: number;
  ujgFidelity?: number;
  domainIntegrity?: number;
  verification?: number;
};

export type DeckPage = {
  id: string;
  conceptualSlide: number;
  conceptualSlideCount: number;
  step: number;
  stepCount: number;
  title: string;
  eyebrow?: string;
  layout: "statement" | "diagram" | "comparison" | "questions";
  revealCount?: number;
  content: DeckContent;
};
