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

Use the same run root for four fresh model invocations. Before each invocation,
open exactly one phase:

```bash
pnpm begin:full-application-phase -- model-a --phase structure
pnpm begin:full-application-phase -- model-a --phase tokens
pnpm begin:full-application-phase -- model-a --phase styling
pnpm begin:full-application-phase -- model-a --phase application
```

Invoke the matching leaf skill in that order:

1. `ujg-design-system-structure-realization`;
2. `ujg-design-token-realization`;
3. `ujg-design-system-styling-realization`;
4. `ujg-to-application-realization`.

Do not combine phases in one model invocation. The control-only
`ujg-to-design-system-realization` skill may identify the next handoff but cannot
generate implementation artifacts. If the host cannot provide a fresh
invocation, stop and resume later with the reported next skill.

The first design-system profile is fixed in the orchestrator's shared stack
reference. Its machine-readable frontmatter is the sole authority for stack,
Theme, and executable-gate requirements. Interface kinds, transports, delivery
mechanisms, state ownership, adapters, runtime, targets, bootstrap, and
documentation are always discovered from the run manifest. The reusable
workflow does not assume the choices in the current case-study manifest.

The token phase may mutate only the run-local UJG itself and only by adding valid
Theme/TokenSource nodes. This is not a projection: the enriched UJG becomes the
authority consumed by subsequent phases. The only permitted UJG-to-code mapping is
`design-system/generated/ds-bindings.manifest.json`, containing Component and
Template bindings only. UJG identifiers must not leak into application literals,
DOM, CSS, routes, payloads, schemas, fixtures, tests, API documentation, or
Storybook. Temporary in-memory analysis is allowed; persisted journey maps,
transition maps, dictionaries, generated clients/types, and trace matrices are
not.

## Generation gates

For every phase, first run static conformance and then executable verification:

```bash
pnpm validate:full-application-run -- model-a --phase <phase>
pnpm verify:full-application-run -- model-a --phase <phase>
```

The executable verifier installs the frozen run workspace and invokes the tools
and commands selected by the canonical profile. Generated wrappers cannot
substitute for these checks. Successful verification closes the active phase;
failure leaves it active for correction. The next phase cannot open early.

Phase boundaries reject future output: structure cannot contain tokens, styling,
or application targets; tokens cannot contain Component/Template styling or
application targets; styling cannot contain application targets.

## Post-generation evaluation

Do not evaluate during generation. After application verification closes the
fourth phase, evaluate the final run independently with all four rubrics:

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

An evaluation may be performed by the implementation model or a later independent
model. After creating a result, validate it independently:

```bash
pnpm validate:evaluation-result -- model-a <phase>
```

## Complete-run validation and retention

After application realization passes executable verification and all four
evaluation results exist, run:

```bash
pnpm validate:full-application-run -- model-a --phase complete
```

Static completion validates immutable inputs, controlled UJG enrichment,
profile conformance, generated token sources, manifest coverage, real binding
modules, selected-target integration, evaluation results, prohibited
projections, and identifier containment. Executable verification separately
proves the selected compilers, tests, builders, and inspection build.

Completed run source and evaluation JSON are checked in. Dependencies, local
databases, build output, Storybook output, coverage, and other runtime artifacts
remain ignored.
