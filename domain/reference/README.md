# Workshop registration reference backend

This Node.js reference realization consumes the generated OpenAPI contract in
`openapi/openapi.json`. Its HTTP router uses the same maintained operation
definitions that generate that contract.

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

## Test

```sh
pnpm test:backend
```
