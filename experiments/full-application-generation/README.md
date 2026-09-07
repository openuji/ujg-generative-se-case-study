# Clean-room full-application generation

This experiment measures how well an AI model can realize a complete application
from one semantic source in a branch containing no reference implementation.

## Authority and evidence

Each run starts with:

- a byte-identical, token-unrealized
  `ujg/workshop-registration.ujg.jsonld` with no Theme or TokenSource nodes;
- byte-identical copies of the JSON Schemas referenced by that UJG; and
- a byte-identical copy of `ujg-implementation.yaml`.

The seeded UJG is the only behavioral, topology, domain, data-binding, and
design-system structural authority. Its existing facts are immutable. The token
phase is the only controlled exception: it generates Theme/TokenSource nodes and
appends them to that same run-local UJG. The enriched UJG is immutable again for
styling and application realization. The implementation manifest selects
architecture. Shared screens under `references/workshop-registration/screens/`
provide appearance evidence only. Git history records the evidence version,
while DTCG `$extensions` record the screen paths used for individual visual
decisions.

No root application, design system, tokens, bindings, or implementation tests
are provided. Another branch or run is forbidden generation input. Referenced
JSON Schemas are UJG-owned contracts, not projections.

## Seed and validate a run

Use a lowercase identifier containing letters, digits, and internal hyphens:

```bash
pnpm seed:full-application-run -- model-a
pnpm validate:full-application-run -- model-a --phase seed
```

The seeder refuses unsafe names and existing targets. It never overwrites a run.
The resulting workspace is
`experiments/full-application-generation/runs/model-a/` and initially contains
only the prepared inputs and no Theme/TokenSource nodes. The token phase creates
DTCG files in run-local `design/tokens/`, writes their relative locations into
generated TokenSource nodes, and composes them through generated Theme nodes.

## Invoke realization skills

Give the implementing model the run root, the shared screen directory, its model
label, and an evaluator label. Invoke:

1. `docs/skills/ujg-to-design-system-realization/SKILL.md`, which performs
   structure, token, and styling phases in order; then
2. `docs/skills/ujg-to-application-realization/SKILL.md`, which realizes every
   interface and runtime boundary selected by the run manifest.

The first design-system profile is fixed in the orchestrator's shared stack
reference. Interface kinds, transports, delivery mechanisms, state ownership,
adapters, runtime, targets, bootstrap, and documentation are always discovered
from the run manifest. The reusable workflow does not assume the choices in the
current case-study manifest.

The token phase may mutate only the run-local UJG itself and only by adding valid
Theme/TokenSource nodes. This is not a projection: the enriched UJG becomes the
authority consumed by subsequent phases. The only permitted UJG-to-code mapping is
`design-system/generated/ds-bindings.manifest.json`, containing Component and
Template bindings only. UJG identifiers must not leak into application literals,
DOM, CSS, routes, payloads, schemas, fixtures, tests, API documentation, or
Storybook. Temporary in-memory analysis is allowed; persisted journey maps,
transition maps, dictionaries, generated clients/types, and trace matrices are
not.

## Evaluation timing and results

The design-system orchestrator requests a static evaluation after each passing
structure, token, and styling gate. The application skill requests its static
evaluation after all manifest-selected targets pass verification. A quality
score does not replace a realization gate.

Rubrics are independent of generation:

- `checks/design-system-structure.md`
- `checks/design-tokens.md`
- `checks/design-system-styling.md`
- `checks/application-realization.md`

They inspect source plus already-existing evidence and never run code, builds,
tests, servers, Storybook, validators, or package managers. The implementation
model may evaluate its own run, or a later independent model may use the same
rubric without rerunning generation.

Store only the final JSON object at:

```text
checks/evaluation/<run-name>/
  structure.<evaluator>.json
  tokens.<evaluator>.json
  styling.<evaluator>.json
  application.<evaluator>.json
```

Evaluator labels are lowercase sanitized identifiers. Never overwrite a result;
use a new evaluator label for each repeat. Record `null` for unknown model names.
Existing evaluation JSON is immutable comparison evidence.

## Complete-run validation and retention

After application realization and its normal verification have completed, run:

```bash
pnpm validate:full-application-run -- model-a
```

This validates immutable seeded facts, byte-identical referenced schemas and
manifest, the Theme/TokenSource-only enrichment boundary, run-relative DTCG
files, generic manifest coverage, selected targets, exact design-system bindings,
prohibited projections, and UJG identifier containment. It does not replace
target-specific tests and builds.

Completed run source and evaluation JSON are checked in. Dependencies, local
databases, build output, Storybook output, coverage, and other runtime artifacts
remain ignored.
