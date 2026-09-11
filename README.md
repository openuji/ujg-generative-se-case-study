# UJG Clean-Room Guided Generation

## Run This

You need an AI coding agent with shell and file access in this repo (e.g.
Claude Code) — not a bare terminal. Tell it, in chat:

- **Generate:** "Seed a run named `<run-name>` under `explicit-gated` guidance and
  implement it following the skills in `docs/skills/explicit-gated/`."
- **Evaluate:** "Evaluate `<run-name>` against the four rubrics in `checks/`."

The agent runs every `pnpm` command in this file itself, phase by phase. You
never type them yourself.

## Start a Run (Agent Protocol)

This is what the agent executes internally — reference, not a human checklist.

Runtime and package-manager requirements are defined only in the canonical
mode-local realization profile:
`docs/skills/<guidance>/ujg-to-design-system-realization/references/v1-stack.md`.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm check
pnpm seed:full-application-run -- <run-name> --guidance explicit-gated
pnpm validate:full-application-run -- <run-name> --guidance explicit-gated --phase seed
```

For `explicit-gated`, use four separate model invocations against the same run
directory:

1. begin `structure`, then invoke `ujg-design-system-structure-realization`;
2. begin `tokens`, then invoke `ujg-design-token-realization`;
3. begin `styling`, then invoke `ujg-design-system-styling-realization`;
4. begin `application`, then invoke `ujg-to-application-realization`.

Open each phase explicitly before its fresh invocation:

```bash
pnpm begin:full-application-phase -- <run-name> --guidance explicit-gated --phase <phase>
```

Each explicit realization phase must pass static validation and the
profile-driven executable verifier before the next generation invocation starts:

```bash
pnpm validate:full-application-run -- <run-name> --guidance explicit-gated --phase <phase>
pnpm verify:full-application-run -- <run-name> --guidance explicit-gated --phase <phase>
```

Only after application verification closes generation, run the four independent,
evaluation-only rubrics in `checks/`. Evaluators write only a new JSON result
under `checks/evaluation/<guidance>/<run-name>/`; an evaluator label can never
overwrite an existing result. Validate each result with:

```bash
pnpm validate:evaluation-result -- <run-name> <phase> --guidance <guidance>
```

After all four results validate:

```bash
pnpm validate:full-application-run -- <run-name> --guidance <guidance> --phase complete
```

See `experiments/implicit-gated/README.md` and
`experiments/explicit-gated/README.md` for mode-specific protocol and retained
evidence.
