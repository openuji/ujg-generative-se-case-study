# UJG Clean-Room Guided Generation

This orphan branch is a self-contained experiment environment for generating
the workshop-registration application with any capable LLM. It intentionally
contains no reference application, design-system implementation, generated
tokens, bindings, tests, transition maps, or realization dictionaries outside
checked-in run evidence.

The input boundary is deliberately small:

- `ujg/workshop-registration.ujg.jsonld` is the sole semantic and structural
  authority and starts without Theme or TokenSource nodes;
- `ujg/schemas/` contains only the data contracts referenced by the UJG;
- `ujg-implementation.yaml` selects realization architecture and targets; and
- `references/workshop-registration/screens/` supplies appearance evidence
  only.

Browser, email, HTTP, persistence, identity, delivery, state ownership, and all
other architecture choices are read from the run-local implementation manifest.
They are not assumptions in the reusable skills or evaluation rubrics.

## Guidance Modes

The experiment keeps two AI-guidance protocols side by side:

- `implicit-gated`: legacy runs where the design-system orchestrator guided
  structure, token, and styling work before application realization.
- `explicit-gated`: runs where every generation phase is opened explicitly and
  must pass static and executable verification before the next invocation.

Run source is stored at `experiments/<guidance>/runs/<run-name>/`. Static
evaluation results mirror the same guidance level at
`checks/evaluation/<guidance>/<run-name>/`.

Each guidance mode also owns its reproducibility assets:

- `docs/skills/implicit-gated/` and `scripts/implicit-gated/` contain the
  historical implicit-gated skills and tooling.
- `docs/skills/explicit-gated/` and `scripts/explicit-gated/` contain the
  historical explicit phase-gated skills and tooling.

## Start a Run

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
pnpm validate:full-application-run -- <run-name> --guidance explicit-gated --phase complete
```

See `experiments/implicit-gated/README.md` and
`experiments/explicit-gated/README.md` for mode-specific protocol and retained
evidence.

The pre-existing backend/domain-model implementation remains on the
`backend-dm` branch for comparison, but it is not present here and must not be
used as generation input.

## Repository Contents

```text
ujg/                                      semantic source and data schemas
ujg-implementation.yaml                  architecture selection
references/workshop-registration/screens appearance-only evidence
docs/skills/implicit-gated/              historical implicit-gated skills
docs/skills/explicit-gated/              historical explicit-gated skills
checks/                                   static evaluation rubrics and fixtures
experiments/implicit-gated/              legacy implicit-gated run evidence
experiments/explicit-gated/              explicit phase-gated run evidence
scripts/implicit-gated/                  historical implicit-gated tooling
scripts/explicit-gated/                  historical explicit-gated tooling
scripts/dispatch-guided-script.mjs       package-command guidance dispatcher
```
