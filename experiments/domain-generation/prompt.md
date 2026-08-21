# Domain derivation prompt — draft

You are given a UJG model that is the upstream behavioral contract for a workshop-registration product.

Derive the **minimal technology-neutral domain model** required to make the modeled user-visible states, transitions, entries, conditions, effects, cross-touchpoint continuation, and identity continuity realizable.

Requirements:

1. Do not invent product capabilities that are not justified by the UJG.
2. For every proposed domain concept, invariant, operation, persistent field, time requirement, or identity requirement, cite the UJG IDs that require it.
3. Distinguish user-visible UJG state from persistent domain state. Do not make them one-to-one by default.
4. Derive identity only as far as the UJG requires. Do not introduce accounts, passwords, OAuth/OIDC, roles, sessions, or MFA unless the UJG requires them.
5. Identify any UJG ambiguity or missing semantic predicate that prevents deterministic derivation instead of guessing silently.
6. Do not choose database technology, HTTP style, framework, or deployment architecture in this stage.

Output a structured domain artifact containing:

- concepts/entities
- value/state types
- relationships
- invariants
- domain operations/effects
- external triggers
- time semantics
- identity/continuity requirements
- persistence requirements
- traceability back to UJG IDs
- unresolved derivation questions
