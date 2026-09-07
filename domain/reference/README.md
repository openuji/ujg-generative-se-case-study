# Workshop registration reference backend

This Node.js reference realization owns an explicit HTTP adapter contract in
`src/http/contract.mjs`. The adapter validates request and response DTOs at the
transport boundary without depending on generated API artifacts. The OpenAPI
document under `openapi/openapi.json` is generated documentation from that same
operation registry.

The implementation deliberately stores domain facts only. Browser journey
history, current form/review state, and prior traversal are frontend-owned as
selected by `ujg-implementation.yaml`.

## Run

```sh
pnpm --filter @openuji/workshop-registration-reference-backend fixtures
pnpm --filter @openuji/workshop-registration-reference-backend start
```

The server listens on `http://localhost:3000`. Fixture identities authenticate
with `Authorization: Bearer token-alex` or `Authorization: Bearer token-blair`.
The fixture command recreates `.data/reference.sqlite` and the fake email
outbox. It is an initialization boundary, not a participant-facing API.

The running API exposes generated documentation at:

- `http://localhost:3000/api/openapi.json`
- `http://localhost:3000/api/docs`

## Test

```sh
pnpm generate:openapi
pnpm validate:openapi
pnpm test:backend
```
