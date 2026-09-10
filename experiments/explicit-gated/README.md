# Explicit-Gated Guided Generation

This bucket contains clean-room generation runs produced with explicit AI
guidance. Each phase must be opened, validated, and executable-verified before
the next fresh invocation starts.

Tracked runs:

- `workshop-gpt-55-codex`: complete, with evaluations under
  `checks/evaluation/explicit-gated/workshop-gpt-55-codex/`.
- `workshop-claude-sonnet-5`: complete, with evaluations under
  `checks/evaluation/explicit-gated/workshop-claude-sonnet-5/`.

Run source lives under `experiments/explicit-gated/runs/<run-name>/`.
Evaluation results live under
`checks/evaluation/explicit-gated/<run-name>/`.
Replay uses the mode-local skills in `docs/skills/explicit-gated/` and tooling
in `scripts/explicit-gated/`.

Use:

```bash
pnpm seed:full-application-run -- <run-name> --guidance explicit-gated
pnpm begin:full-application-phase -- <run-name> --guidance explicit-gated --phase <phase>
pnpm validate:full-application-run -- <run-name> --guidance explicit-gated --phase <phase>
pnpm verify:full-application-run -- <run-name> --guidance explicit-gated --phase <phase>
pnpm validate:evaluation-result -- <run-name> <phase> --guidance explicit-gated
```

Read
[`docs/skills/explicit-gated/ujg-to-design-system-realization/references/v1-stack.md`](../../docs/skills/explicit-gated/ujg-to-design-system-realization/references/v1-stack.md)
for the canonical realization profile.
