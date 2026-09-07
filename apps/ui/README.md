# Workshop registration reference frontend

This is maintained React application code. The canonical UJG defines behavior;
the prepared design-system binding manifest identifies the components and
templates this app composes. The app owns browser-local form, review, and
navigation state while the domain engine owns domain outcomes.

Run the domain engine and this app in separate terminals:

```sh
pnpm dev:domain-engine
pnpm dev:ui
```

The fake browser identity defaults to `token-alex`. Tests or local tools can select another fixture subject with `localStorage.setItem("referenceAuthToken", "token-blair")`.
