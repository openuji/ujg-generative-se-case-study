import type { ModelResult } from "./types";

export const modelResults: ModelResult[] = [
  {
    model: "GPT-5 Codex",
    status: "finished",
    qualityScore: 63.33,
    ujgFidelity: 3.4,
    domainIntegrity: 4,
    verification: 3.2
  },
  {
    model: "Claude Sonnet",
    status: "finished",
    qualityScore: 74,
    ujgFidelity: 3.7,
    domainIntegrity: 3.6,
    verification: 2.8
  },
  {
    model: "Qwen 3.5",
    status: "finished",
    qualityScore: 16.67,
    ujgFidelity: 1,
    domainIntegrity: 1,
    verification: 0
  }
];
