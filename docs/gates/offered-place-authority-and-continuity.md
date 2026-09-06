# Offered-Place Authority and Continuity

## Status

Resolved realization decision for the workshop-registration case study.

## Purpose

Define the authority and continuity rules required to realize the offered-place flow without duplicating interaction semantics from the canonical UJG.

Observable states, transitions, entries, conditions, effects, and participant-facing outcomes are defined by the canonical UJG and its derived Domain Model. This document does not restate them.

## Decision

Participant authority is established from an authenticated identity source.

An offered-place identifier may be used to locate an offer, but possession of that identifier does not itself grant authority to read or mutate the offer.

The realization must bind the addressed offer to the authenticated participant before participant-specific offer data is exposed or a domain-changing action is executed.

Conceptually:

```text
authenticated participant
+
addressed offer
↓
subject-to-offer binding
↓
authorized realization of the current modeled behavior
```

## Authority Rule

The realization must preserve this invariant:

> An offer identifier locates an offer; authenticated participant identity establishes authority.

UJG identifiers, route identifiers, entry bindings, URLs, or client-supplied topology references are not authorization credentials.

The concrete authentication and authorization mechanism is a realization concern and is intentionally not prescribed here.

## Continuity Rule

Prior traversal through the UJG journey is not required as proof of authority.

The realization must not persist interaction topology merely to prove that the participant previously visited a particular state, followed a particular transition, or opened a particular email.

Where the canonical UJG permits re-entry, refresh, or direct materialization, the realization must reconstruct the appropriate observable result from current authoritative facts and the applicable entry context.

The exact observable result is determined from the current canonical UJG and derived Domain Model, not from this document.

## Realization Boundary

For this case study, participant identity is provided by an authenticated fixture identity provider.

This decision does not prescribe:

- JWTs;
- cookies;
- server-side login sessions;
- OAuth or OIDC;
- signed URLs;
- one-time tokens;
- persisted UJG journey sessions.

Any such mechanism may be chosen only as an implementation detail, provided it preserves the authority and continuity rules above.

## Verification Obligations

The realization must demonstrate that:

1. participant-specific offer access is subject-bound to the authenticated participant;
2. an offer identifier alone cannot authorize access or mutation;
3. client-supplied UJG identifiers cannot bypass authority checks;
4. prior UJG traversal is not required unless the canonical model later explicitly makes it authoritative;
5. any re-entry supported by the canonical UJG can be reconstructed from current authoritative facts rather than persisted interaction position.

Verification must derive the concrete cases from the current canonical UJG and derived Domain Model rather than hard-coding a duplicate list here.

## Source-of-Truth Boundary

This document owns only the authority and continuity decisions above.

It does not own or redefine:

- UJG topology;
- UJG entries or transitions;
- UJG conditions or effects;
- observable offer states;
- domain operations;
- domain status values;
- surface selection.

If any of those change, this document remains valid unless the authority or continuity assumptions themselves change.
