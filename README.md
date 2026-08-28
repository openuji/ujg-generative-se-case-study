# UJG Generative Software Engineering Case Study — Workshop Registration

Initial repository scaffold for evaluating UJG as an upstream semantic contract for domain derivation, frontend generation, and executable verification.

## Current scope

The checked-in model describes the workshop-registration landscape, including regular registration, waitlisting, and the cross-touchpoint offered-place flow (email -> workshop application).

The first implementation/evaluation slice should remain narrow: **waitlisted -> offered place -> email -> app -> accept / decline / expire**.

## Source-of-truth rule

- `ujg/workshop-registration.ujg.jsonld` is the canonical UJG representation and the semantic source of truth.
- `ujg/workshop-registration.ujg.yaml` is a derived DX projection generated from the canonical JSON-LD.
- Regenerate the YAML with `pnpm sync:ujg-yaml`; do not add YAML-only semantic content.
- Do not maintain independent semantic journey definitions in backend requirements, frontend prompts, Playwright tests, or Storybook.

## Quick start

Requirements: Node.js 22 and pnpm 10.14.

```bash
corepack enable
pnpm install
pnpm validate:ujg-design-system
```
## Current model status

See `docs/model-review.md`.

## Repository shape

```text
ujg/                              upstream model: YAML + canonical JSON-LD
experiments/domain-generation/    UJG -> technology-neutral domain derivation
experiments/domain-generation/reference/
                                  reviewed/frozen derivation

domain/reference/                 later: deterministic reference backend

design-system/                    later: components/templates bound via UJG DS
apps/reference-frontend/          later: human reference implementation
tests/journey-mesh/               later: UJG-derived execution, not duplicate flows
scripts/                           parity/review/bootstrap tooling
docs/                              model review and decisions
```

## Case-study sequence

1. Keep the canonical JSON-LD, derived YAML, and validation scripts in sync.
2. Implement the concrete design-system component/template package bound by the UJG Design System nodes.
3. Run the domain-model generation experiment from the UJG.
4. Review/freeze one reference domain artifact and implement the deterministic reference domain/service.
5. Build one human reference frontend against the frozen domain and design system.
6. Add Journey Mesh path selection/driver support so Playwright executes paths derived from the same UJG.
7. Only then run frontend generation and agentic repair experiments.
8. Runtime/OTel/Grafana remain a later extension, not part of repository v1.

## Journey Mesh

Journey Mesh is currently consumed from source because its packages are private workspace packages. Bootstrap the pinned source checkout with:

```bash
pnpm bootstrap:journey-mesh
pnpm install
```

The current integration point is intentionally documented but not wired into a fake passing test: the present compiler expects Phase/Step plus Observability data and rejects ambiguous branch paths. See `tests/journey-mesh/README.md`.
