---
name: ujg-domain-model-to-implementation-realization
description: Implement a backend from a root UJG implementation manifest, a canonical UJG JSON-LD document with an evaluated Domain Model extension, and existing frontend consumers. Use when the requested work is implementation rather than Domain Model derivation or post-implementation conformance review.
---

# UJG Domain Model to Implementation Realization

Build the backend described by `ujg-implementation.yaml`. Treat the complete
UJG as the behavioral source of truth, its embedded Domain Model as the domain
source, the manifest as the technology and workspace selection, and the listed
frontend paths as consumers to satisfy.

Do not create a separate realization blueprint. The manifest is the explicit
realization input. The implementation, generated API contract, tests, and final
conformance trace are its outputs.

## Read the manifest

Use `ujg-implementation.yaml` in the workspace root unless the user supplies a
different manifest path. Resolve every relative path from the manifest's
directory.

The supported manifest is one mapping:

```yaml
manifest_version: 1
ujg: path/to/model.ujg.jsonld
backend: path/to/backend
frontend:
  - path/to/frontend
runtime: runtime-family
transport: transport-family
api_contract: contract-format
storage: storage-adapter
auth: authentication-adapter
email: email-adapter
init_state: initialization-source
interaction_state: interaction-owner
```

Require `manifest_version: 1` and all listed keys. `frontend` must be a
non-empty list. The UJG and frontend paths must exist; the backend path may be
created. Inspect only the current worktree and the paths selected by the
manifest. Do not obtain implementation inputs from unrelated branches,
worktrees, or generated artifacts outside those paths.

Manifest values are authoritative implementation choices. For choices not in
the manifest, follow existing repository conventions and lockfiles. Introduce
the smallest additional dependency that satisfies the source and consumer
contracts. Do not expand the manifest with values that can be determined safely
from the repository.

## Read the semantic source

Read the entire UJG, including
`extensions["org.openuji.domain-model"]`. Record its content hash in generated
contracts and the conformance trace.

Before implementation:

- validate the Domain Model schema and every internal reference;
- validate journey ownership, transition locality, conditional sets, effects,
  entries, exits, and parent continuations;
- validate Surface, DataBinding, DataSchema, and SurfaceRealization references
  used by the consumers;
- stop if a missing predicate, branch, invariant, authority decision, or
  external owner would require invented observable behavior.

Use the current `ujg-ed-domain-model-implementation` skill for semantic
implementation rules and the relevant current UJG module skills when the model
crosses those modules.

## Inspect the consumers

Inspect the listed frontend paths before defining the backend contract. Read
existing component props, routes, data access code, generated bindings, and
tests. Use UJG DataBindings and their external JSON Schemas as the canonical
visible data shapes.

Existing frontend code is evidence about integration needs, not authority to
override the UJG. If a consumer contradicts the canonical UJG, report the
conflict instead of changing domain behavior silently.

## Derive the backend boundary

Implement domain facts, Domain Operations, authoritative Conditions, Effects,
and Invariants assigned to the backend. Derive each effectful application
command from its Command and the complete conditional Transition set. Preserve
one observable result variant per modeled branch.

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

## Implement from the profile

Use the selected runtime, transport, storage, authentication, email, API
contract, and initialization mechanisms. Keep fixture/setup APIs visibly
separate from participant-facing APIs. Fixtures may establish external facts;
they must not introduce participant-facing operations or hidden UJG workflow
state.

At each effect boundary, atomically re-evaluate mutable availability,
eligibility, uniqueness, expiry, subject binding, and other modeled predicates.
Commit only the Effect belonging to the selected branch. Define safe repeated
request behavior and ensure competing commands cannot violate invariants.

Generate the selected `api_contract` from the implemented public boundary and
include semantic source references. Generate or update consumer types only
when the existing frontend uses them or the selected contract workflow requires
them.

## Verify and finish

Derive tests from the UJG rather than duplicating a hand-written happy path.
Verify:

- every branch of every backend-relevant conditional set;
- every effect and invariant at its transaction boundary;
- non-effect branches leave domain state unchanged;
- wrong-subject, unauthenticated, and unmodeled mutation attempts fail safely;
- direct entry and refresh follow the authority decision without workflow
  sessions;
- repeated and competing requests preserve the modeled result;
- response materializations satisfy their referenced DataSchemas;
- the generated API contract matches both implementation and consumers.

Pin dependencies using the repository package manager, provide commands to
initialize, run, regenerate, check, and test the backend, and verify those
commands from the current worktree.

After code exists, apply `ujg-ed-domain-model-implementation` and write a final
trace containing the UJG hash, realization disposition, code evidence,
verification evidence, and status for every domain-relevant element. Do not
claim conformance while a required trace row or test is failed or blocked.
