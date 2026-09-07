---
name: ujg-topology-to-domain-model-derivation
description: Derive or revise a minimal, technology-neutral UJG Domain Model from canonical UJG behavior and explicit business knowledge.
---

# UJG Topology to Domain Model Derivation

Use this skill when a UJG document needs a new or revised Domain Model
extension. Model only the business facts, relationships, operations, and
invariants needed to realize canonical journey semantics. Do not choose
implementation architecture.

## Live Source of Truth

Unless the user supplies a dated specification, a schema, or an offline
constraint, retrieve the active Editor's Draft before deriving:

- `https://ujg.specs.openuji.org/ed/graph`
- `https://ujg.specs.openuji.org/ed/extensions/domain-model`
- the Domain Model JSON Schema linked by that extension page

Read the active Condition, Effect, Entry Binding, and Data Contract modules
only when the UJG uses them. Do not silently rely on repository snapshots,
examples, or a prior run. If the live specification is unavailable, ask for an
explicit schema or state that derivation is blocked.

The canonical payload is only
`UJGDocument.extensions["org.openuji.domain-model"]`. Apply the live schema
exactly; traceability belongs on supported contained elements, not on the
payload root.

## Derive From Topology

First validate the input against the live Graph rules. Stop and report a
non-canonical graph rather than normalizing it silently. In particular, inspect
journey ownership and local transition endpoints, `Command` references,
composite child-journey references, boundary entry and exit mappings, and
`JourneyEntryIndex` contracts.

Apply these semantic limits:

- A `Command` identifies an invocation. Its `commandRef` does not define an
  operation, branch, effect, or result by itself.
- Each child journey of a `CompositeState` is an independent evidence scope.
  Common containment does not imply a domain relationship, aggregate, bounded
  context, order, synchronization, collective completion, or Cartesian state.
- `fromExitRef` and `toEntryRef` refine parent-local boundary transitions; they
  may require business continuity but do not justify sessions, tokens, routes,
  callbacks, or authority mechanisms.
- A `JourneyEntryIndex` is a catalogue, not traversal evidence.
- `multiInstance` describes graph occurrences, not domain multiplicity or
  identity. `EntryBinding.value` is opaque materialization context.

For every reachable `State` or `CompositeState`, including one selected by a
`JourneyEntry` or reached through a `Transition`, assign exactly one
classification. Do not group nodes merely because their labels are similar;
group them only when they assert the same business situation and differ only in
interaction or presentation. Classify the business claim made by the node, not
its visual form.

- `domain-backed`: the node asserts a business fact, relationship, or lifecycle
  situation that must be represented so later behavior can materialize it,
  decide from it, or preserve an invariant. Model the minimum owner and fact.
- `domain-derived`: the node asserts a business conclusion whose truth is
  decidable from domain-backed facts, relationships, and explicit business
  rules. Model any missing inputs or rule needed for that decision, but do not
  create an independent fact or lifecycle value just because the node exists.
- `interaction/presentation`: the node describes application-local workflow or
  a user's editing, review, validation feedback, display, or navigation
  progress. The supplied UJG and business knowledge do not establish a distinct
  business fact, relationship, outcome, or rule. Create no Domain Model element
  for it.
- `structural`: the node's role is graph composition, entry, exit, or
  navigation rather than a business or user-interaction situation. Create no
  Domain Model element for that node; inspect its child journeys and boundary
  transitions separately.

A transition is domain-relevant only when at least one of these is true: its
source or target is `domain-backed` or `domain-derived`; a condition decides a
business distinction; an effect establishes a business consequence; a boundary
requires continuity of a business subject or relationship; or supplied
business knowledge says it is domain-relevant. `commandRef` alone never makes
a transition domain-relevant. Domain relevance requires analysis, not a new
Domain Model element when existing facts and rules already provide support.

For each domain-relevant transition, identify the domain facts or predicates
that make the source, condition, and target true; the consequence established
by any effect; and any required continuity. A command contributes invocation
identity and terminology only. Record a business policy that the UJG does not
determine as a question rather than inventing it.

For every domain-relevant transition that establishes or changes a fact,
relationship, or lifecycle value, determine the policy for a repeat invocation
with the same relevant subject and target. The UJG or supplied business
knowledge must establish a distinct branch, idempotent no-effect success, an
allowed update, or rejection. If it does not, record that exact policy question
in the evidence mapping; do not infer cardinality or add an invariant,
condition, state, outcome, or persistence mechanism to resolve it.

## Test Branches and Model Minimality

For each `ConditionalTransitionSet`, compare its alternatives as a set. A
modeled fact or predicate must make each branch decidable without collapsing
distinct conditions merely because their labels or nearby states are related.
An entry and a later condition may evaluate the same mutable domain predicate
at different moments; that timing alone does not create two domain facts. Split
them only when the UJG or supplied business knowledge establishes different
meanings, or permits different values for the same subject in the same relevant
evaluation context. Otherwise record the evaluation point in the evidence
mapping.

Treat form submission, correction, form-error, and review flows as
`interaction/presentation` by default. A valid/invalid condition on such a
flow does not alone justify a ValueObject or DomainOperation. Model one only
when explicit business knowledge, a stated business rule, or a domain-relevant
effect requires the underlying data or validation behavior. Do not create an
otherwise empty ValueObject solely to mirror a condition.

When UJG uses `DataSchema` or `DataBinding`, treat external schema fields and
JSON constraints as surface materialization or command-invocation contracts,
not domain facts. Do not copy or trace them into the Domain Model solely
because they overlap; model a property or ValueObject only when UJG behavior or
supplied business knowledge establishes stable domain meaning.

When a UJG condition requires a distinction but leaves its determining
mechanism open, do not present a chosen mechanism as UJG fact. Model the least
committal domain fact or predicate that supports the distinction, or make the
chosen realization an explicit design choice in the evidence mapping. State
that it is a choice and, where useful, distinguish it from another plausible
realization.

A DomainOperation invoked by a UJG transition may state a precondition already
established by the domain meaning of that transition's source state. Treat it as
a new UJG-alignment obligation only when it adds a separate recheck, rejection,
branch, or user-visible outcome not represented by that state or the
transition's conditions.

Do not treat mere reachability from a prior `JourneyEntry`, ancestor
transition, or earlier state as evidence that a predicate still holds when an
operation runs. An earlier Effect or boundary mapping can support it only when
its stated semantics establish the required continuity. In every other case, a
precondition requires support from the invoking transition's source state, its
conditions, or supplied business knowledge; otherwise it is a separate
recheck.

Before finalizing, audit minimality at the element level:

- A property label must describe every allowed value; split concepts whose
  values belong to different dimensions of meaning.
- When two or more properties describe one subject's lifecycle, enumerate the
  combinations permitted by their allowed values and every operation's
  postconditions. Keep them separate only when independent combinations are
  required by UJG or supplied business knowledge; otherwise model one lifecycle
  status. If they remain separate, establish the valid combinations through
  postconditions or a justified invariant.
- Keep a direct relationship only when its removal loses a behavior or meaning
  not already expressed by another relationship path.
- Do not infer uniqueness or cardinality from an `already` or `not already`
  condition alone; it establishes only the predicate needed by that branch.
- Do not materialize the negation of an existence or lifecycle predicate as a
  provisional status solely to decide an `already` or `not already` condition.
  Add a prospective lifecycle status only when UJG or supplied business
  knowledge establishes it as a business situation.
- Do not add an invariant that merely repeats a modeled single-valued status
  or an operation postcondition. Keep invariants for constraints that can be
  violated despite the other modeled facts and operations.

## Model and Validate

Create the smallest schema-valid set of entities, value objects, properties,
relationships, operations, and invariants. Use `ujgRefs` only where the cited
UJG element directly justifies the model element.

Do not infer persistence, APIs, sessions, authentication, authorization,
queues, events, locks, aggregates, bounded contexts, services, repositories,
or frontend/backend placement.

Return the payload, a concise evidence-to-model mapping including explicit
omissions and repeat-invocation findings, and unresolved domain questions.
Validate the payload against the live schema; resolve its internal references
and every present `ujgRefs` value. Confirm that domain-relevant conditions and
effects are supported, sibling journeys have not been flattened into
unsupported domain claims, and the result remains technology-neutral.
