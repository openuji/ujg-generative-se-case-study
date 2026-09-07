# UJG Generative Software Engineering Case Study — Workshop Registration

Executable case study for evaluating UJG as an upstream semantic contract for domain derivation, full-stack implementation, and verification.

## Current scope

The checked-in model describes the workshop-registration landscape, including regular registration, waitlisting, and the cross-touchpoint offered-place flow (email -> workshop application).

The reference implementation covers workshop browsing, registration, waitlist submission, and the cross-touchpoint offered-place flow.

## Source-of-truth rule

- `ujg/workshop-registration.ujg.jsonld` is the canonical UJG representation and semantic source of truth.
- External schemas under `ujg/schemas/` are referenced data contracts.
- Do not maintain independent semantic journey definitions in backend requirements, frontend prompts, Playwright tests, or Storybook.

## Quick start

Requirements: Node.js 22 and pnpm 10.14.

```bash
corepack enable
pnpm install
pnpm validate:ujg-source
pnpm validate:ujg-design-system
```

## Run the reference application

The application uses a Node.js backend, SQLite fixture database, fake authentication,
a fake email outbox, and an authored React/Vite frontend.

Initialize or reset all fixture state:

```bash
pnpm fixtures:backend
```

Start the backend in one terminal:

```bash
pnpm dev:backend
```

Start the frontend in another terminal:

```bash
pnpm dev:ui
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). The frontend proxies
API calls to the backend at `http://127.0.0.1:3000`.

Running `pnpm fixtures:backend` again restores the initial state. Stop the
backend before resetting its database, then restart it afterward.

### Included fixtures

| Fixture | Initial state | What it demonstrates |
|---|---|---|
| Service Design Foundations | Registration open | Fresh registration with Blair; already-registered with Alex |
| Facilitation Practice | Waitlist open | New, repeated, and already-waitlisted submissions |
| Research Operations | Registration closed | Closed-registration outcome |
| Alex Nguyen / `token-alex` | Already confirmed for Service Design Foundations; already waitlisted for Facilitation Practice | Already-registered, already-waitlisted, and offered-place flows |
| Blair Jensen / `token-blair` | No participation | Creating a fresh registration or waitlist participation |
| `offer-alex-open` | Available until 2099 | Accepting or declining an offer |
| `offer-alex-expired` | Expired by its timestamp | Expired-offer materialization |
| `offer-alex-unavailable` | Unavailable | Unavailable-offer materialization |

The SQLite database and fake email outbox are generated under
`apps/domain/.data/`. The outbox contains the offered-place email and its
link into the application. This directory is local runtime state and is not
committed.

### Register for a workshop

The browser defaults to the fake Alex identity. Alex is already registered for
**Service Design Foundations**, so opening that workshop demonstrates the
modeled **Already registered** branch. To create a fresh registration, select
the clean Blair fixture identity in the browser console:

```js
localStorage.setItem("referenceAuthToken", "token-blair")
```

1. Open the workshops overview.
2. Open **Service Design Foundations**.
3. Select **Register** and enter a name and valid email address.
4. Select **Continue**, review the details, then select **Confirm registration**.

The backend checks availability again when confirmation is submitted. With
Blair, the successful fixture outcome is **Registration confirmed**.

### Join a waitlist

With the default Alex identity, submitting **Facilitation Practice** produces
the modeled **Already waitlisted** outcome. To create a new waitlist entry,
select the clean Blair fixture identity in the browser console:

```js
localStorage.setItem("referenceAuthToken", "token-blair")
```

Then:

1. Open **Facilitation Practice** from the overview.
2. Select **Join waitlist** and enter a name and valid email address.
3. Select **Continue**, review the details, then select **Join waitlist**.

The result is **Waitlisted**. Repeating the same submission produces
**Already waitlisted** without creating a duplicate participation.

To switch back to Alex, run:

```js
localStorage.setItem("referenceAuthToken", "token-alex")
```

### Respond to an offered place

Reset fixtures if you have already resolved the offer, switch back to Alex,
and open:

- [http://127.0.0.1:5173/offers/offer-alex-open](http://127.0.0.1:5173/offers/offer-alex-open)

Select **Accept place** to change Alex's participation from waitlisted to
confirmed, or **Decline place** to leave Alex waitlisted. An offer can be
resolved only once; reset fixtures to try the other choice.

The other materialized offer outcomes can be inspected at:

- [Expired offer](http://127.0.0.1:5173/offers/offer-alex-expired)
- [Unavailable offer](http://127.0.0.1:5173/offers/offer-alex-unavailable)

Possession of an offer ID is not authorization. Offer routes use the fake
authenticated identity, and an offer belonging to Alex is hidden from Blair.

### Inspect API documentation

The backend serves OpenAPI documentation from the same operation registry used
by the HTTP server:

- [OpenAPI JSON](http://127.0.0.1:3000/api/openapi.json)
- [Swagger UI](http://127.0.0.1:3000/api/docs)

## Domain-model workflow

Use the workspace-local [UJG topology to Domain Model derivation skill](docs/skills/ujg-topology-to-domain-model-derivation/SKILL.md)
before selecting implementation architecture.

After Domain Model evaluation, record the implementation choices and workspace
paths in [`ujg-implementation.yaml`](ujg-implementation.yaml), then use the
[UJG Domain Model to Implementation Realization skill](docs/skills/ujg-domain-model-to-implementation-realization/SKILL.md).
The skill reads that manifest and the complete UJG, validates the selected
design system, then implements the backend and frontend as maintained source.
Use `ujg-ed-domain-model-implementation` after code exists to audit
implementation conformance against the full UJG when that level of review is
needed.

## Repository shape

```text
ujg/                              canonical JSON-LD and referenced data schemas
experiments/domain-generation/    UJG -> technology-neutral domain derivation
experiments/domain-generation/reference/
                                  reviewed/frozen derivation

apps/domain/                      authored reference backend/domain service
apps/ui/                          authored reference frontend
design-system/                    selected UJG-bound presentation realization
tests/journey-mesh/               UJG-derived execution, not duplicate flows
scripts/                           parity/review/bootstrap tooling
docs/                              model review and decisions
```

## Case-study sequence

1. Keep the canonical JSON-LD, referenced schemas, and validation scripts in sync.
2. Implement the concrete design-system component/template package bound by the UJG Design System nodes.
3. Run the domain-model generation experiment from the UJG.
4. Evaluate and freeze one reference domain artifact.
5. Freeze the root UJG implementation manifest.
6. Execute the realization skill: implement the backend and frontend from the UJG and prepared design system.
7. Audit backend, frontend, contract, and browser behavior against the complete UJG.
8. Add Journey Mesh path selection/driver support so Playwright executes paths derived from the same UJG.
9. Repeat implementation and agentic repair experiments against the frozen inputs and conformance gates.
10. Runtime/OTel/Grafana remain a later extension, not part of repository v1.

## Journey Mesh

Journey Mesh is currently consumed from source because its packages are private workspace packages. Bootstrap the pinned source checkout with:

```bash
pnpm bootstrap:journey-mesh
pnpm install
```

The current integration point is intentionally documented but not wired into a fake passing test: the present compiler expects Phase/Step plus Observability data and rejects ambiguous branch paths. See `tests/journey-mesh/README.md`.
