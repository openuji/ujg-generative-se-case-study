import type { ReactNode } from "react";

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
  content: ReactNode;
};
