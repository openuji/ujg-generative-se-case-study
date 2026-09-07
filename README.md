# UJG clean-room full-application generation

This orphan branch is a self-contained experiment environment for generating
the workshop-registration application with any capable LLM. It intentionally
contains no reference application, design-system implementation, generated
tokens, bindings, tests, transition maps, or realization dictionaries.

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

## Start a run

Runtime and package-manager requirements are defined only in the canonical
[realization profile](docs/skills/ujg-to-design-system-realization/references/v1-stack.md).

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm check
pnpm seed:full-application-run -- <run-name>
pnpm validate:full-application-run -- <run-name> --phase seed
```

Then give your implementation model the new run directory and invoke, in order:

1. `docs/skills/ujg-to-design-system-realization/SKILL.md`
2. `docs/skills/ujg-to-application-realization/SKILL.md`

The design-system orchestrator runs structure, token, and styling realization.
The token phase generates DTCG token files and adds the corresponding Theme and
TokenSource nodes to the run-local UJG. The application skill realizes every
interface and runtime boundary selected by the copied manifest.

Each realization phase must pass static validation and the profile-driven
executable verifier before its evaluation is written:

```bash
pnpm validate:full-application-run -- <run-name> --phase <phase>
pnpm verify:full-application-run -- <run-name> --phase <phase>
```

The profile is the only owner of package versions, target toolchains, Theme
inventory, and verification commands. Skills and checks consume it rather than
restating those requirements.

After realization:

```bash
pnpm verify:full-application-run -- <run-name> --phase application
pnpm validate:full-application-run -- <run-name> --phase complete
```

Each phase has an independent, evaluation-only rubric in `checks/`. Evaluators
write only a new JSON result under `checks/evaluation/<run-name>/`; an evaluator
label can never overwrite an existing result. Validate each result with:

```bash
pnpm validate:evaluation-result -- <run-name> <phase>
```

See
`experiments/full-application-generation/README.md` for the full protocol,
isolation rules, skill gates, and result naming.

The pre-existing backend/domain-model implementation remains on the
`backend-dm` branch for comparison, but it is not present here and must not be
used as generation input.

## Repository contents

```text
ujg/                                      semantic source and data schemas
ujg-implementation.yaml                  architecture selection
references/workshop-registration/screens appearance-only evidence
docs/skills/                              realization instructions
checks/                                   static evaluation rubrics and fixtures
experiments/full-application-generation/ isolated, checked-in generation runs
scripts/                                  seeding and static validation tooling
```
