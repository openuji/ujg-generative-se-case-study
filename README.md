# UJG Generative Software Engineering Case Study — Workshop Registration

Initial repository scaffold for evaluating UJG as an upstream semantic contract for domain derivation, frontend generation, and executable verification.

## Current scope

The checked-in model describes the workshop-registration landscape, including regular registration, waitlisting, and the cross-touchpoint offered-place flow (email -> workshop application).

The first implementation/evaluation slice should remain narrow: **waitlisted -> offered place -> email -> app -> accept / decline / expire**.

## Source-of-truth rule

- `ujg/workshop-registration.ujg.yaml` is the DX authoring representation.
- `ujg/workshop-registration.ujg.jsonld` is the canonical UJG representation consumed by tools.
- The YAML must compile/flatten losslessly into the canonical model. The current pair has exact 126/126 node and property parity.
- Do not maintain independent semantic journey definitions in backend requirements, frontend prompts, Playwright tests, or Storybook.

## Quick start

Requirements: Node.js 22 and pnpm 10.14.

```bash
corepack enable
pnpm install
pnpm check
pnpm review:ujg
```

`pnpm check` verifies YAML/JSON-LD parity and canonical reference integrity. `pnpm review:ujg` also reports known Graph/semantic review findings without failing the command. `pnpm check:ujg` is strict and currently fails on the two known missing `defaultEntryRef` values until those semantics are resolved.

## Current model status

Good:

- DX YAML and canonical JSON-LD are exactly equivalent after flattening.
- 126 stable node IDs match.
- no dangling canonical references were found.
- User/touchpoint assignment covers the workshop app and email journey.
- Effects are attached to the main mutating transitions.

Open before domain-generation benchmarking:

- `urn:ujg:journey:workshop-detail` has no required `defaultEntryRef`.
- `urn:ujg:journey:offered-place-app` has no required `defaultEntryRef`.
- domain-dependent branch predicates are currently expressed mostly through transition labels rather than the UJG Conditions module.

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

1. Resolve the two Graph entry-semantics blockers and decide which branches need explicit Conditions.
2. Add the UJG Design System model/bindings and concrete component/template package.
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
