# Generated reference frontend

This directory is generated from the root realization manifest, canonical UJG, generated OpenAPI, and design-system binding manifest. Do not hand-edit journey behavior here.

Regenerate and check drift from the repository root:

```sh
pnpm generate:reference-frontend
pnpm validate:reference-frontend
```

Run the backend and this app in separate terminals:

```sh
pnpm dev:backend
pnpm --filter @openuji/workshop-registration-reference-frontend dev
```

The fake browser identity defaults to `token-alex`. Tests or local tools can select another fixture subject with `localStorage.setItem("referenceAuthToken", "token-blair")`.
