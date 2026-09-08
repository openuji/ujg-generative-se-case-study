# Implicit-Gated Guided Generation

This bucket retains legacy clean-room generation runs produced with implicit AI
guidance. The design-system orchestrator guided structure, token, and styling
work in sequence, then the application skill realized the manifest-selected
targets.

Tracked runs:

- `codex`
- `workshop-claude-sonnet`
- `qwen-workshop-smws`

Run source lives under `experiments/implicit-gated/runs/<run-name>/`.
Evaluation results live under
`checks/evaluation/implicit-gated/<run-name>/`.
Replay uses the mode-local skills in `docs/skills/implicit-gated/` and tooling
in `scripts/implicit-gated/`.

These runs predate explicit phase-state receipts. Validation and evaluation
helpers therefore do not require `.ujg-realization-state.json` for this guidance
mode. Existing low-quality or failed runs are retained as comparison evidence and
are not required to pass complete-run validation.

Read
[`docs/skills/implicit-gated/ujg-to-design-system-realization/references/v1-stack.md`](../../docs/skills/implicit-gated/ujg-to-design-system-realization/references/v1-stack.md)
for the canonical realization profile.
