# UJG Generative Software Engineering Case Study — Workshop Registration

Initial repository scaffold for evaluating UJG as an upstream semantic contract for domain derivation, frontend generation, and executable verification.

## Current scope

The checked-in model describes the workshop-registration landscape, including regular registration, waitlisting, and the cross-touchpoint offered-place flow (email -> workshop application).

The first implementation/evaluation slice should remain narrow: **waitlisted -> offered place -> email -> app -> accept / decline / expire**.

## Source-of-truth rule

- `ujg/workshop-registration.ujg.yaml` is the DX authoring representation.
- `ujg/workshop-registration.ujg.jsonld` is the canonical UJG representation consumed by tools.
- The YAML must compile/flatten losslessly into the canonical model. 
- Do not maintain independent semantic journey definitions in backend requirements, frontend prompts, Playwright tests, or Storybook.

## Quick start

Requirements: Node.js 22 and pnpm 10.14.

```bash
corepack enable
pnpm install
```
## Current model status

See `docs/model-review.md`.

## Domain-model workflow

Use the workspace-local [UJG topology to Domain Model derivation skill](docs/skills/ujg-topology-to-domain-model-derivation/SKILL.md)
before selecting implementation architecture.

After Domain Model evaluation, record the implementation choices and workspace
paths in [`ujg-implementation.yaml`](ujg-implementation.yaml), then use the
[UJG Domain Model to Implementation Realization skill](docs/skills/ujg-domain-model-to-implementation-realization/SKILL.md).
The skill reads that manifest, the complete UJG with its embedded Domain Model,
and the selected frontend consumers before implementing the backend. Use
`ujg-ed-domain-model-implementation` after code exists to audit implementation
conformance against the full UJG.

## Repository shape

```text
ujg/                              upstream model: YAML + canonical JSON-LD
experiments/domain-generation/    UJG -> technology-neutral domain derivation
experiments/domain-generation/reference/
                                  reviewed/frozen derivation

domain/reference/                 target selected for the reference backend

design-system/                    later: components/templates bound via UJG DS
apps/reference-frontend/          later: human reference implementation
tests/journey-mesh/               later: UJG-derived execution, not duplicate flows
scripts/                           parity/review/bootstrap tooling
docs/                              model review and decisions
```

## Case-study sequence

1. Resolve the two Graph entry-semantics blockers and decide which branches need explicit Conditions.
2. Add the UJG Design System model/bindings and concrete component/template package.
3. Run the domain-model generation experiment from the UJG.
4. Evaluate and freeze one reference domain artifact.
5. Freeze the root UJG implementation manifest.
6. Execute the realization skill and audit the resulting reference backend.
7. Build one human reference frontend against the frozen domain and design system.
8. Add Journey Mesh path selection/driver support so Playwright executes paths derived from the same UJG.
9. Only then run frontend generation and agentic repair experiments.
10. Runtime/OTel/Grafana remain a later extension, not part of repository v1.

## Journey Mesh

Journey Mesh is currently consumed from source because its packages are private workspace packages. Bootstrap the pinned source checkout with:

```bash
pnpm bootstrap:journey-mesh
pnpm install
```

The current integration point is intentionally documented but not wired into a fake passing test: the present compiler expects Phase/Step plus Observability data and rejects ambiguous branch paths. See `tests/journey-mesh/README.md`.
