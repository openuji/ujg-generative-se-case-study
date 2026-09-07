---
name: ujg-domain-model-to-implementation-realization
description: Build or complete an application from a UJG JSON-LD model, realization manifest, and prepared design-system bindings. Use when UJG is the behavioral implementation reference, not for source-code generation or UJG modeling alone.
---

# UJG Model to Application Implementation

Build the application selected by the realization manifest. The UJG is the
behavioral reference, the manifest is the desired implementation boundary, and
design-system bindings identify the authored visual exports to compose.

The primary mode is implementation from scratch. When selected targets already
contain code, use the same process to catch up: preserve correct in-scope work,
identify differences from the manifest and UJG, and complete or adjust it.
Never treat existing application source as disposable.

## Manifest

Read the manifest supplied by the user, or `ujg-implementation.yaml` at the
workspace root. Resolve all relative paths from its directory. New manifests
use version 4:

```yaml
manifest_version: 4
ujg: path/to/model.ujg.jsonld

backend: path/to/backend

interfaces:
  - touchpoint_ref: urn:ujg:touchpoint:application
    target: path/to/interface
    kind: browser
    design_systems: [path/to/design-system]
    interaction_state_owner: client
    transport:
      protocol: http
      documentation:
        format: openapi
        output: path/to/backend/openapi/openapi.json
        ui: swagger-ui
  - touchpoint_ref: urn:ujg:touchpoint:email
    kind: email
    design_systems: [path/to/design-system]
    interaction_state_owner: external
    delivery:
      adapter: adapter-choice

adapters:
  persistence: adapter-choice
  identity: adapter-choice

bootstrap: initialization-choice
```

`backend`, `interfaces`, `adapters`, and `bootstrap` are optional when the
selected UJG and requested application do not need them. Every modeled
Touchpoint selected for realization needs exactly one matching
`touchpoint_ref`; do not assume a browser implementation covers email or other
touchpoints. An interface may be a browser, CLI, native, desktop, email, voice,
embedded, or another user-facing touchpoint. `target` is required when the
touchpoint has its own implementation target and omitted when its realization
lives in the root backend, such as an email delivery adapter.

`transport` is an interface property: omit it for direct in-process use, and
declare it independently for interfaces that cross a backend boundary. Use
`delivery` for a touchpoint such as email, where the backend renders and sends a
message through a selected adapter rather than exposing an interactive transport.

`interaction_state_owner` is one of `client`, `server`, `external`, or
`shared`. Use `shared` only when the model or manifest specifies the split.
`kind`, transport, and adapters are explicit choices; framework, runtime,
build tooling, and package manager are deliberately absent.

Treat the manifest as desired state. Every selected target, interface,
design-system path, adapter, and transport requirement must be inspected and
either implemented or reported as blocked. Do not silently ignore a manifest
parameter because an existing target predates it.

Resolve every declared `touchpoint_ref` against the UJG and ensure that no
Touchpoint is assigned to more than one interface. Report a modeled touchpoint
that has no realization decision instead of silently omitting it.

When the manifest version or shape changes, find and update every in-scope
manifest reader, validator, script, and documentation reference before relying
on it. If the model requires authoritative effects and no backend target is
selected, report the missing output boundary rather than placing those effects
in an interface.

## Discover implementation technology

Determine implementation technology in this order:

1. An explicit applicable manifest choice.
2. The selected target's package metadata, configuration, and source.
3. The selected design system's package metadata, exports, and bindings.
4. Existing workspace conventions and lockfiles.

An explicit choice wins over discovery. If selected inputs conflict, report the
conflict before changing architecture. If a target is empty, use the framework
required by its design system; if the design system is framework-neutral, use
the established workspace convention. Ask for a decision only when neither
source provides a safe choice.

Read the full UJG, its local data schemas, the selected design-system packages
and binding manifests, selected targets, and relevant package/test/runtime
configuration before coding. Do not use unrelated worktrees, previous apps, or
generated artifacts as behavioral input.

## Discover the model

Parse the complete UJG and resolve internal references. Discover the semantics
present in the document rather than expecting fixed identifiers, journey names,
routes, outcome names, or artifact names.

Build a temporary working map that covers, where present:

- journeys, entries, exits, states, and transitions;
- commands, conditions, conditional transition sets, effects, and invariants;
- surfaces, surface realizations, slots, slot bindings, data bindings, and data
  schemas; and
- optional extensions, including a Domain Model.

This map is reasoning context only. Do not check it in as a trace, gate, or
runtime metadata. Keep UJG IDs out of ordinary application code unless the
product explicitly needs them.

Unknown or incomplete semantics are not permission to invent behavior. State
the missing decision and implement only the modeled scope. A model without
domain authority can still produce an interface; do not invent backend
workflows, persistence, or authorization for it.

## Compose interfaces

Use each binding manifest as an index from UJG artifact references to authored
component or template exports. Resolve every selected `SurfaceRealization` and
its slot bindings for each declared touchpoint before composing an interface.

With multiple design systems, each artifact must resolve to exactly one selected
binding. Report missing or ambiguous bindings instead of substituting a
look-alike component. Application code owns composition, data flow, and
interaction wiring; the design system owns reusable visual primitives.

Implement client-owned navigation, editing, validation, correction, review,
and refresh/direct-entry materialization as local state. Client code may
validate input, but it must not choose authoritative availability, eligibility,
uniqueness, expiry, identity binding, or effect outcomes.

## Implement authoritative boundaries

For backend-owned behavior, implement authoritative conditions, effects,
invariants, and identity/authorization checks at the state-changing boundary.
Preserve every modeled conditional branch as an observable result. Re-evaluate
mutable facts atomically when committing an effect. Repeated and competing
commands must not violate modeled invariants.

Keep transport contracts explicit and maintained next to the adapters that use
them. A transport contract is an implementation boundary, not a second journey
definition and not input for generating interface code.

When an HTTP interface requests OpenAPI documentation, maintain one route
registry that the HTTP server actually uses. Generate the declared OpenAPI JSON
from that implemented registry, including its methods, paths, authentication,
request schemas, and response variants. Serve Swagger UI when requested. The
generated OpenAPI document describes the running API; it does not determine
application behavior or generate application code.

The only permitted generated artifacts are design-system binding manifests and
requested implementation documentation such as OpenAPI. Do not create source
code generators, disposable application source, generated clients or types,
generated realization metadata, or permanent gate/trace documents.

## Verify

Validate the UJG and selected design-system bindings with repository tooling
when available. Derive focused tests from the discovered model:

- cover modeled conditional branches and effectful transitions assigned to an
  implementation boundary;
- verify modeled invariants, idempotency, authority checks, and invalid mutation
  rejection;
- verify client-owned validation, correction, review, and outcome rendering;
- verify relevant data shapes and design-system composition; and
- when OpenAPI is requested, verify it is reproducible from the implemented
  route registry and describes the served routes.

Run relevant tests, typechecks, builds, and documentation checks. Report what
ran, what passed, what changed to catch up an existing target, and any
verification that could not run. Do not create a gate document or claim
behavior that the selected UJG does not model.
