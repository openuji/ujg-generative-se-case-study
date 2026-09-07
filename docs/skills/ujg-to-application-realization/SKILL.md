---
name: ujg-to-application-realization
description: Build or complete all application boundaries selected by a UJG realization manifest, using the complete UJG and prepared design-system bindings as inputs. Use for maintained application source, not UJG modeling or design-system generation.
---

# UJG to Application Realization

Realize the complete UJG within the boundaries selected by the supplied
`ujg-implementation.yaml`. The UJG is the behavioral contract; the manifest
selects architecture; prepared design-system bindings identify authored visual
exports.

Require the token-enriched run-local UJG produced by the design-system workflow
and treat it as immutable. Theme/TokenSource generation is outside this skill.

The primary mode is implementation from scratch. When selected targets already
contain code, preserve correct in-scope work and bring it into conformance. Never
inspect or copy implementations outside the selected run.

## Manifest-driven scope

Read the supplied manifest, or `ujg-implementation.yaml` at the run root. Resolve
all relative paths from its directory. Validate its version and shape before
reading or writing selected targets.

Discover, never assume:

- the optional domain-engine target and runtime;
- every interface's `touchpoint_ref`, `target`, `kind`,
  `interaction_state_owner`, selected `design_systems`, `transport`, and
  `delivery` configuration;
- persistence, identity, and other selected adapters;
- bootstrap behavior; and
- requested implementation documentation.

Iterate over `interfaces` generically. Resolve each `touchpoint_ref` against the
UJG and ensure it is assigned once. Every modeled Touchpoint must receive an
explicit realization decision. Do not hardcode browser, email, HTTP, SQLite,
fake authentication, target directories, or any other choice from an example
manifest. Implement only what the active manifest selects.

If a selected interface kind or runtime lacks enough implementation detail,
discover technology from its target metadata, selected design system, and run
workspace conventions. Report a remaining architectural ambiguity rather than
silently substituting a familiar stack.

## Source discovery

Read the full UJG, all referenced schemas, every selected design-system package
and binding manifest, all selected targets, and relevant run-local package/test
configuration. Do not use unrelated worktrees, earlier runs, or the repository's
reference implementation as input.

Validate and resolve the complete UJG. Build any needed trace or realization
matrix only in memory. Cover journeys, entries, exits, states, transitions,
commands, conditional sets, conditions, effects, invariants, Surfaces,
realizations, slots, data contracts, Touchpoints, and the embedded Domain Model.
Discard temporary maps; do not check them in.

Unknown semantics do not authorize invented behavior. A manifest without a
domain authority cannot move authoritative effects into an interface.

## Interface realization

For each manifest interface:

- honor its selected interaction-state owner;
- use transport only when declared and delivery only when declared;
- resolve every UJG SurfaceRealization through exactly one selected design-system
  binding;
- preserve SlotBinding composition by parsing the UJG directly;
- treat missing or ambiguous bindings as blockers;
- keep presentation, interaction state, transport, and authoritative domain
  responsibilities at their selected boundaries; and
- implement direct entry, refresh/materialization, validation, review,
  correction, outcomes, and continuations required by that Touchpoint.

Application source uses ordinary product names and APIs. It contains no UJG
identifier literals and no persisted UJG-to-code lookup structure.

## Authoritative behavior

Where the manifest selects a domain engine, implement every relevant condition,
effect, invariant, identity/authorization rule, and continuation at the
state-changing boundary. Preserve each modeled conditional outcome distinctly.
Re-evaluate mutable facts atomically with effects. Protect repeated and competing
commands, continuity, and subject/resource binding.

Do not treat the Domain Model extension as a CRUD specification. The complete
graph determines entry eligibility, allowed invocation context, branches,
effects, exits, and continuation. Do not infer sibling-journey synchronization or
aggregate behavior from shared CompositeState containment.

Transport contracts are maintained implementation boundaries, not journey
definitions and not interface-generation inputs. If documentation is requested,
derive it from the implemented transport registry rather than from a second UJG
projection. Persist documentation only when the manifest requests an output.

## Generated-artifact boundary

The only permitted UJG-to-code mapping is each selected design system's
`generated/ds-bindings.manifest.json`. Do not create:

- generated application source, clients, or types;
- route, transition, screen, outcome, or realization maps;
- generation metadata or UJG-derived registries;
- permanent trace/gate documents; or
- UJG identifiers in routes, payloads, DOM, fixtures, documentation, tests, or
  implementation literals.

Ordinary authored contracts, tests, adapters, and DTCG token files are allowed
when they do not become another semantic authority.

## Verification and evaluation

Derive verification from the UJG in memory. Test applicable entry eligibility,
every condition branch, effect and no-effect outcome, invariant, invalid mutation,
idempotency, concurrency, subject authority, boundary continuation, data shape,
and design-system composition. Run relevant tests, typechecks, builds, and
documentation checks.

After verification, evaluate the run using `checks/application-realization.md`.
Write only its JSON result to
`checks/evaluation/<run-name>/application.<evaluator>.json`, using a sanitized
lowercase evaluator label. Refuse to overwrite an existing result.

Report manifest-selected targets, implementation changes, verification evidence,
evaluation path, and gaps. Do not claim full realization while any selected
target or required branch is missing or unverified.
