# Model review — 2026-08-21

This review is intentionally narrow: it checks the supplied DX YAML and canonical JSON-LD as the starting contract for the generative software engineering case study. It does not redesign the journey.

## What is already solid

- The DX YAML flattens to exactly the same 126 nodes as the canonical JSON-LD.
- All 126 IDs match exactly.
- All serialized properties match exactly after flattening; there is no YAML-only semantic content besides `ujgTarget`.
- No canonical UJG references are dangling.
- The model has a single human `User` with both workshop-app and email touchpoints. The top-level journeys assign that user and child journeys inherit it.
- The email → workshop-app handoff is explicitly modeled with nested journeys and an exported child exit.
- Mutating user actions are already separated with Effects for confirm registration, join waitlist, accept offered place, and decline offered place.

## Blockers before calling the graph conformant

The current Graph Editor's Draft requires every `Journey` to declare exactly one `defaultEntryRef`, and that entry must be listed in the journey's `entryRefs`.

Two journeys currently omit it:

1. `urn:ujg:journey:workshop-detail`
2. `urn:ujg:journey:offered-place-app`

This is not just a syntactic omission. Both journeys intentionally expose multiple entries whose selection depends on domain state:

- workshop detail: registration open / waitlist open / registration closed
- offered-place app: offer open / expired / unavailable

Do not fix this by arbitrarily selecting a default without first deciding how domain-dependent materialization is meant to map into Graph entry semantics.

## Semantic under-specification relevant to domain generation

The current document does not compose the UJG Conditions module. Several branches therefore encode important predicates only in labels:

- registration details valid vs invalid
- registration confirm vs place no longer available
- waitlist details valid vs invalid
- join waitlist vs already waitlisted
- accept offered place vs accept after expiry

This is legal as a plain Graph, but it is weak input for the domain-derivation experiment because an LLM has to infer the predicate from natural-language labels. Before evaluating domain-model generation, decide whether these should become explicit `Condition` / `ConditionSet` resources.

User-choice alternatives such as **Edit** vs **Confirm**, or **Accept** vs **Decline**, are not the same problem: those are separate affordances, not merely domain predicates.

## Not present yet, intentionally

The supplied v1 does not yet include:

- UJG Design System module nodes
- UJG Phase/Step nodes
- UJG Observability bindings
- Runtime / Mapping data

That is acceptable for this repository initialization. They should be added only when the corresponding case-study stage starts.

## Journey Mesh compatibility note

The current `journey-mesh` compiler is not a drop-in validator for this v1 model. At the pinned `main` commit recorded in this repository it compiles Phase/Step-oriented execution plans, expects Observability bindings for states/transitions, and rejects ambiguous transition branches while building a step path. The first integration task is therefore to define the smallest adapter/extension needed for selected paths through this graph rather than hand-authoring duplicate Playwright journeys.
