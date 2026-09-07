---
name: ujg-domain-model-to-implementation-realization
description: Implement and verify a backend and frontend from a root UJG implementation manifest, a canonical UJG JSON-LD document with an evaluated Domain Model extension, and a prepared design-system realization. Use for full-stack implementation rather than code generation, Domain Model derivation, or post-implementation review alone.
---

# UJG Domain Model to Implementation Realization

Implement the application described by `ujg-implementation.yaml`.

The complete UJG is the behavioral source of truth. Its embedded Domain Model
is the domain source. The selected design system is the presentation source.
The manifest selects the workspace and technology. The agent writes and
maintains the backend, frontend, HTTP boundary, tests, and conformance trace as
ordinary source code.

This is an implementation skill, not a source-code generator. Do not create a
generator for the backend, frontend, HTTP contract, client types, routes, or
trace metadata. Do not make application source disposable or require a
regeneration/check command for it. The only generated artifact in this case
study is the design-system binding manifest, because it is an inventory that
verifies UJG Design System references against already-authored components and
templates.

## Read the manifest

Use `ujg-implementation.yaml` in the workspace root unless the user supplies a
different manifest path. Resolve every relative path from the manifest's
directory.

The supported manifest is one mapping:

```yaml
manifest_version: 3
ujg: path/to/model.ujg.jsonld
backend: path/to/backend
frontend: path/to/frontend
design_system: path/to/design-system
backend_runtime: runtime-family
frontend_runtime: runtime-family
frontend_framework: framework
frontend_build: build-system
transport: transport-family
storage: storage-adapter
auth: authentication-adapter
email: email-adapter
init_state: initialization-source
interaction_state: interaction-owner
```

Require `manifest_version: 3` and every listed key. The UJG and design-system
paths must exist. The backend and frontend are implementation targets: inspect
and preserve existing code, then make deliberate edits. Do not obtain
implementation inputs from unrelated branches, worktrees, or old generated
artifacts.

Manifest values are authoritative technology choices. For choices not in the
manifest, follow existing repository conventions and lockfiles. Introduce the
smallest dependency that satisfies the source contracts.

## Validate and map the semantic source

Read the entire UJG, including `extensions["org.openuji.domain-model"]`. Record
its content hash in the hand-maintained conformance trace, not in application
source.

Before implementation:

- validate the Domain Model schema and every internal reference;
- validate journey ownership, transition locality, conditional sets, effects,
  entries, exits, and parent continuations;
- validate Surface, DataBinding, DataSchema, SurfaceRealization, Slot, and
  SlotBinding references;
- resolve every external DataSchema and selected design-system artifact; and
- stop if a missing predicate, branch, invariant, authority decision, external
  owner, or presentation binding would require invented observable behavior.

Use `ujg-ed-domain-model-implementation` for the semantic implementation rules
and the relevant UJG module skills when the model crosses their boundaries.

Create or update `docs/gates/implementation-conformance-trace.md`. It must
contain one row for every domain-relevant UJG element with these columns:

| UJG node ID | Node type | Semantic intent | Owning layer | Realization decision | Implementation evidence | Verification evidence | Status | Justification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

Use `implemented`, `reduced`, or `out_of_scope` for the realization decision;
use `passed`, `failed`, `blocked`, or `not_applicable` for status. Explain every
reduction or excluded layer. This trace is the auditable mapping between the
UJG and code. Do not put UJG IDs, source hashes, or topology metadata into
ordinary React components or runtime client state.

## Inspect the design-system input

Inspect the selected design-system path before implementation. Read its artifact
registry, component props, templates, generated binding manifest, tests, and
package conventions. Verify Components, Templates, Slots, and bindings against
the UJG SurfaceRealizations. Use UJG DataBindings and external JSON Schemas as
the canonical visible data shapes.

The generated binding manifest is an index, not an application compiler. Use it
to locate the component or template selected by each UJG realization, then
compose those exports in authored frontend code. Do not generate look-alike
components, opaque wrappers, or a parallel component library.

Design-system code is evidence about rendering integration; it cannot override
Graph, domain, data-contract, or authority semantics. Report a conflict instead
of compensating for it in application code.

## Implement the backend boundary

Implement domain facts, Domain Operations, authoritative Conditions, Effects,
and Invariants assigned to the backend. Derive each effectful application
command from its Command and complete conditional Transition set. Preserve one
observable result variant for every modeled branch.

Write the HTTP routes, request validation, response validation, and DTO shapes
as maintained adapter source. A normal backend route contract is useful: it
allows the server to validate its boundary and gives tests one explicit place to
inspect transport behavior. It is not generated from UJG and it must not turn
into a second semantic workflow definition. Keep the code-level contract free
of UJG topology identifiers; link it to UJG nodes from the conformance trace.

Do not require OpenAPI unless the user asks for a published API description. If
an OpenAPI document is needed later, author and version it as a real public
contract; do not use it to generate the frontend.

Honor `interaction_state`. When it is `frontend`, form entry, editing,
validation feedback, review, navigation, and current UJG position remain in
the frontend. Do not persist journey sessions, transition history, review
proofs, or continuation tokens unless another explicit input makes them
authoritative.

Resolve authenticated identity through the selected `auth` adapter. A resource
identifier locates a resource but does not authorize access. Reconstruct
refresh and direct-entry materializations from authenticated identity and
current domain facts when the UJG and authority decisions permit them.

At each effect boundary, atomically re-evaluate mutable availability,
eligibility, uniqueness, expiry, subject binding, and other modeled predicates.
Commit only the Effect belonging to the selected branch. Define safe repeated
request behavior and ensure competing commands cannot violate invariants.

## Implement the frontend

Implement the selected frontend as maintained application source. Read the UJG
for entries, states, Commands, transitions, conditional sets, exits, Surfaces,
SurfaceRealizations, Slots, SlotBindings, DataBindings, and external JSON
Schemas. Use those inputs to make explicit decisions in the app; do not parse
them at runtime and do not write a generator around them.

Compose the prepared design-system exports selected by the binding manifest.
Implement browser routes, local form state, validation feedback, review and
edit flows, API calls, backend-outcome handling, refresh, and direct-entry
materialization as normal frontend code. Keep the implementation readable by
expressing the state model in application terms rather than embedding UJG
identifiers.

The frontend owns local editing, correction, review, and navigation when
`interaction_state` is `frontend`. It must not decide authoritative
availability, uniqueness, expiry, subject binding, or effect outcomes. It
invokes a backend command, accepts the backend-selected result variant, and
renders the modeled surface.

Maintain client DTO types and API methods next to the frontend adapter. They
are a deliberately maintained representation of the HTTP boundary, not a
generated projection. Update them with the server and verify the integration
whenever the model requires a changed observable result.

## Verify and finish

Derive tests from the UJG and conformance trace, not only from implementation
happy paths. Verify:

- every branch of every backend-relevant conditional set;
- every effect and invariant at its transaction boundary;
- non-effect branches leave domain state unchanged;
- wrong-subject, unauthenticated, and unmodeled mutation attempts fail safely;
- repeated and competing requests preserve the modeled result;
- response materializations satisfy their referenced DataSchemas;
- every frontend-owned transition and validation branch;
- every required SurfaceRealization and SlotBinding composition;
- every backend result variant selects the modeled frontend materialization; and
- direct browser entry and refresh reconstruct from current domain facts.

Run the relevant validation, typecheck, build, and test commands. Record exact
commands and results in the trace. A blocked test environment is a verification
gap, not evidence of conformance.

After code exists, apply `ujg-ed-domain-model-implementation` and complete the
trace. Do not claim conformance while a required trace row or test is failed or
blocked.
