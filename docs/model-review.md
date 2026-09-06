# Model review — 2026-09-06

This review is intentionally narrow: it checks the canonical JSON-LD and derived DX YAML as the starting contract for the generative software engineering case study. It does not redesign the journey.

## What is already solid

- The canonical JSON-LD is the semantic source of truth.
- The canonical JSON-LD contains 328 addressable nodes.
- No canonical UJG references are dangling.
- The model has a single human `User` with both workshop-app and email touchpoints. The top-level journeys assign that user and child journeys inherit it.
- The email → workshop-app handoff is explicitly modeled with nested journeys and an exported child exit.
- Mutating user actions are already separated with Effects for confirm registration, join waitlist, accept offered place, and decline offered place.
- Important branch predicates are now explicit `Condition` and `ConditionSet` nodes.
- The UJG Design System layer realizes all 47 modeled surfaces with 47 `SurfaceRealization` nodes, backed by standalone templates, slots, slot bindings, components, and token source references.
- The UJG Data Contract layer declares 8 external `DataSchema` references and 20 `DataBinding` nodes for realized data-bearing content and status surfaces.
- The workshops overview composition surface and all action/command surfaces intentionally have no Data Contract binding in this pass.

## Design System status

- Design System bindings follow `Surface -> SurfaceRealization -> Component/Template`; Graph nodes do not point directly to components.
- The `DesignSystem` node only scopes token sources through `tokenSourceRefs`; components, templates, and realizations are discovered as standalone top-level nodes.
- State/page surfaces use template realizations for application shell, email message, form flow, and status page layouts.
- Ordinary action surfaces use direct component realizations for primary, secondary, destructive, and email-link actions.
- Slot bindings target modeled surfaces only; content regions are represented by content surfaces with component-backed realizations, and action affordances target command-backed surfaces.
- Design System nodes do not encode routes, URLs, handlers, props, variants, CSS classes, runtime facts, or business logic.

## Not present yet, intentionally

The supplied v1 does not yet include:

- UJG Phase/Step nodes
- UJG Observability bindings
- Runtime / Mapping data

That is acceptable for this repository stage. They should be added only when the corresponding case-study stage starts.

## Journey Mesh compatibility note

The current `journey-mesh` compiler is not a drop-in validator for this v1 model. At the pinned `main` commit recorded in this repository it compiles Phase/Step-oriented execution plans, expects Observability bindings for states/transitions, and rejects ambiguous transition branches while building a step path. The first integration task is therefore to define the smallest adapter/extension needed for selected paths through this graph rather than hand-authoring duplicate Playwright journeys.
