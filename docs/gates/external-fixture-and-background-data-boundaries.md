# External Fixture and Background-Data Boundaries

## Status

Resolved realization decision for the workshop-registration case study.

## Purpose

Declare ownership of external and background facts required by the case study without duplicating participant-facing behavior from the canonical UJG or its derived Domain Model.

Observable interaction behavior is owned by the canonical UJG. Durable domain semantics are owned by the derived Domain Model. This document owns only the external integration and fixture boundaries described below.

## Decision

The case study uses the following explicit realization boundaries:

| Concern | Realization owner |
| --- | --- |
| Workshop catalog and source data | Fixture/catalog integration |
| Participant identity | Authenticated fixture identity provider |
| Offer provisioning and externally established offer facts | Fixture offer-provisioning integration |
| Email delivery | Fake/test email adapter |

These boundaries provide external facts or side-effect adapters required to exercise the case study.

They do not define additional participant-facing behavior.

## Workshop Catalog Boundary

Workshop descriptive and availability-related source data may be supplied by a fixture/catalog integration.

The participant-facing implementation may consume and project that data as required by the current canonical UJG and derived Domain Model.

This boundary does not imply a workshop-administration lifecycle or additional participant-facing commands.

## Participant Identity Boundary

Participant identity is supplied by an authenticated fixture identity provider.

The identity boundary establishes the current participant subject independently of UJG topology, route identifiers, offer identifiers, or client-supplied state.

Authority rules that depend on participant identity are defined separately in the offered-place authority decision.

## Offer Provisioning Boundary

Offers and any prerequisite externally established offer facts may be created or supplied by a fixture offer-provisioning integration.

This boundary exists only to establish the starting facts needed to exercise behavior already defined by the canonical UJG and derived Domain Model.

Provisioning activity must not be interpreted as additional participant-facing topology or domain operations unless such behavior is explicitly modeled later.

## Email Boundary

Email delivery is represented by a fake/test email adapter.

The adapter may provide deterministic evidence that an email would have been delivered and may expose the continuation context needed by the case study.

Email delivery is an integration concern, not an additional participant-facing UJG workflow.

## No Hidden Workflow Ownership

None of these fixture or integration boundaries may become a hidden server-side UJG workflow engine.

They must not require or own interaction facts such as:

- current UJG state;
- previous UJG transition;
- form/review completion;
- journey continuation state;
- caller-decided condition outcomes.

If future modeled semantics require such facts to become authoritative, that change must first be reflected in the canonical source model or explicitly chartered.

## Scope Rule

External integrations establish prerequisite facts and side-effect boundaries.

The participant-facing implementation owns only the behavior required by the current canonical UJG and derived Domain Model.

This document deliberately does not enumerate current domain operations, statuses, transitions, or branches so that it does not become stale when the model evolves.

## Verification Obligations

The realization must demonstrate that:

1. required workshop data can be supplied through the catalog boundary without inventing participant-facing workshop-management behavior;
2. participant identity comes from the authenticated fixture identity boundary;
3. prerequisite offer facts can be provisioned without exposing provisioning as participant-facing behavior;
4. email delivery can be exercised through the fake/test adapter;
5. fixture setup does not require persisted UJG journey state;
6. external facts and participant-facing domain mutations remain distinguishable in implementation and tests;
7. no additional lifecycle mechanisms are introduced merely because fixtures need to establish test data.

Concrete participant-facing verification cases must be derived from the current canonical UJG and derived Domain Model rather than duplicated in this document.

## Source-of-Truth Boundary

This document owns only the external ownership allocations and integration boundaries above.

It does not own or redefine:

- UJG topology;
- UJG commands or transitions;
- UJG conditions or effects;
- domain operations;
- domain status values;
- persistence design;
- HTTP contracts.

If the UJG or derived Domain Model changes, these boundaries remain valid unless ownership of the external concerns themselves changes.
