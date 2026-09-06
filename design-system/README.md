# Workshop registration design system

This package contains the concrete React implementation used by the UJG Design System module in `../ujg/workshop-registration.ujg.jsonld`.

The UJG remains the semantic source of truth. React files provide structural rendering only; generated bindings and validation scripts are the only files that keep UJG node IDs.

Useful commands:

```bash
pnpm generate:ds-bindings
pnpm validate:ujg-design-system
pnpm typecheck:design-system
pnpm build:design-system
pnpm build-storybook
```
