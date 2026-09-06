---
name: ujg-domain-model-to-implementation-realization
description: Generate and verify a backend and frontend from a root UJG implementation manifest, a canonical UJG JSON-LD document with an evaluated Domain Model extension, and an existing design-system realization. Use for full-stack realization rather than Domain Model derivation or post-implementation review alone.
---

# UJG Domain Model to Implementation Realization

Build the complete implementation described by `ujg-implementation.yaml`.
Treat the complete UJG as the behavioral source of truth, its embedded Domain
Model as the domain source, the existing design system as the presentation
realization, and the manifest as the technology and workspace selection.

Do not create a separate realization blueprint. The manifest is the explicit
realization input. The shared API contract, backend, generated frontend, tests,
and final conformance trace are its outputs.

## Read the manifest

Use `ujg-implementation.yaml` in the workspace root unless the user supplies a
different manifest path. Resolve every relative path from the manifest's
directory.

The supported manifest is one mapping:

```yaml
manifest_version: 2
ujg: path/to/model.ujg.jsonld
backend: path/to/backend
frontend: path/to/frontend
design_system: path/to/design-system
backend_runtime: runtime-family
frontend_runtime: runtime-family
frontend_framework: framework
frontend_build: build-system
frontend_mode: generated-or-existing
transport: transport-family
api_contract: contract-format
storage: storage-adapter
auth: authentication-adapter
email: email-adapter
init_state: initialization-source
interaction_state: interaction-owner
```

Require `manifest_version: 2` and every listed key. `frontend_mode` must be
`generated` or `existing`. The UJG and design-system paths must exist. The
backend path may be created. With `frontend_mode: generated`, the frontend may
be absent, empty, or documentation-only and is an output target rather than a
missing-input error. Treat its generated application files as disposable; do
not preserve manual application behavior that has no source contract. With
`frontend_mode: existing`, require and inspect the existing frontend before
freezing the shared contract.

Inspect only the current worktree and the paths selected by the manifest. Do
not obtain implementation inputs from unrelated branches, worktrees, or
generated artifacts outside those paths.

Manifest values are authoritative implementation choices. For choices not in
the manifest, follow existing repository conventions and lockfiles. Introduce
the smallest additional dependency that satisfies the source contracts. Do not
expand the manifest with values that can be determined safely from the
repository.

## Validate the semantic source

Read the entire UJG, including
`extensions["org.openuji.domain-model"]`. Record its content hash in generated
contracts, generated frontend metadata, and the conformance trace.

Before implementation:

- validate the Domain Model schema and every internal reference;
- validate journey ownership, transition locality, conditional sets, effects,
  entries, exits, and parent continuations;
- validate Surface, DataBinding, DataSchema, SurfaceRealization, Slot, and
  SlotBinding references;
- resolve every external DataSchema and selected design-system artifact; and
- stop if a missing predicate, branch, invariant, authority decision, external
  owner, or presentation binding would require invented observable behavior.

Use the current `ujg-ed-domain-model-implementation` skill for semantic
implementation rules and the relevant current UJG module skills when the model
crosses their boundaries.

## Inspect the design-system input

Inspect the selected design-system path before defining the shared contract.
Read its artifact registry, component props, templates, generated bindings,
tests, and package conventions. Verify its Components, Templates, Slots, and
bindings against the UJG SurfaceRealizations. Use UJG DataBindings and their
external JSON Schemas as the canonical visible data shapes.

Existing design-system code is evidence about rendering integration, not
authority to override Graph, domain, or data-contract semantics. Report a
conflict instead of compensating for it in generated application code.

## Derive the shared integration contract

Derive the selected `api_contract` after validating the UJG and design system
and before implementing either consumer of the transport. The contract is the
generated integration seam between backend and frontend; it is not a second
behavioral source of truth.

Include only participant-facing reads and commands required by the UJG, plus
clearly separated fixture/test interfaces required by the manifest. Preserve
one stable result variant for every backend-owned conditional branch. Visible
payloads must satisfy their referenced DataSchemas; transport envelopes may
carry resource identity and outcome discrimination needed for integration.

Associate operations and result variants with their UJG entries, Commands,
Transitions, states, and source hash using generated contract metadata. A
caller must never select a UJG condition, Transition, state, entry, or desired
outcome. EntryBinding values identify materializations, not URLs; any browser
or HTTP path convention is a realization decision recorded by the generated
contract.

Generate the contract from one maintained route/operation definition and
verify it against the running implementation. Do not maintain a second manual
OpenAPI description.

## Implement the backend boundary

Implement domain facts, Domain Operations, authoritative Conditions, Effects,
and Invariants assigned to the backend. Derive each effectful application
command from its Command and complete conditional Transition set. Preserve one
observable result variant per modeled branch.

Derive read models from current authoritative facts, JourneyEntry selection,
Surfaces, and DataBindings. Server-derived UJG references may be returned as
trace evidence; callers must not choose conditions, transitions, entries,
states, availability, expiry, or desired outcomes.

Honor `interaction_state`. When it is `frontend`, form entry, editing,
validation feedback, review, navigation, and current UJG position remain in the
frontend. Do not persist journey sessions, transition history, review proofs,
or continuation tokens unless another explicit input makes them authoritative.

Resolve authenticated identity through the selected `auth` adapter. A resource
identifier locates a resource but does not authorize access. Reconstruct
refresh and direct-entry materializations from authenticated identity and
current domain facts when the UJG and authority decisions permit them.

Use the selected backend runtime, transport, storage, authentication, email,
API contract, and initialization mechanisms. Keep fixture/setup interfaces
visibly separate from participant-facing APIs. Fixtures may establish external
facts; they must not introduce participant-facing operations or hidden UJG
workflow state.

At each effect boundary, atomically re-evaluate mutable availability,
eligibility, uniqueness, expiry, subject binding, and other modeled predicates.
Commit only the Effect belonging to the selected branch. Define safe repeated
request behavior and ensure competing commands cannot violate invariants.

## Generate the frontend

When `frontend_mode` is `generated`, create a deterministic generator and its
output at the selected frontend path. Generate the application from:

- Graph entries, states, Commands, transitions, conditional sets, and exits;
- Surfaces, SurfaceRealizations, Slots, and SlotBindings;
- the selected design-system artifact registry;
- DataBindings and their external JSON Schemas; and
- the generated API contract.

Generate browser entry routes, design-system composition, form and review
interaction state, an API client, backend-outcome handling, and direct-entry or
refresh materialization. Derive resource parameters and transport calls from
the API contract. Do not treat EntryBinding values as URL templates unless the
UJG says so.

Keep local editing, correction, review, and navigation behavior in the
frontend when `interaction_state` is `frontend`. The frontend must not decide
authoritative availability, uniqueness, expiry, subject binding, or effect
outcomes. It invokes a command, accepts the backend-selected result variant,
and renders the corresponding modeled Surface.

Keep UJG identifiers in generated bindings and trace metadata rather than
ordinary application components. Reuse the selected design-system artifacts;
do not generate parallel look-alike components or hide required child Surfaces
inside opaque wrappers.

Provide generation and check commands. Check mode must regenerate into an
isolated temporary directory and fail on any diff from the committed frontend.
Generated outputs must record the UJG, API-contract, and design-system binding
hashes. A second generation from unchanged inputs must produce no diff.

## Verify and finish

Derive tests from the UJG rather than duplicating a hand-written happy path.
Verify:

- every branch of every backend-relevant conditional set;
- every effect and invariant at its transaction boundary;
- non-effect branches leave domain state unchanged;
- wrong-subject, unauthenticated, and unmodeled mutation attempts fail safely;
- repeated and competing requests preserve the modeled result;
- response materializations satisfy their referenced DataSchemas;
- the generated API contract matches the backend and generated client;
- every frontend-owned transition and validation branch;
- every required SurfaceRealization and SlotBinding composition;
- every backend result variant selects the modeled frontend materialization;
- direct browser entry and refresh reconstruct from current domain facts; and
- browser-level paths cover the integrated backend/frontend behavior.

Pin dependencies using the repository package manager. Provide and execute
commands to initialize, run, regenerate, check, build, and test both
applications from the current worktree.

After code exists, apply `ujg-ed-domain-model-implementation` and write a final
trace containing the UJG hash, realization disposition, code evidence,
verification evidence, owning layer, and status for every domain-relevant
element. Apply current module-specific UJG skills where realization crosses
Graph, Surface, Data Contract, or Design System boundaries. Do not claim
conformance while a required trace row or test is failed or blocked.
