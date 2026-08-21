# Journey Mesh integration

Do not hand-author a second journey specification in Playwright.

The intended architecture is:

`UJG JSON-LD -> selected executable path -> Journey Mesh plan -> Playwright adapter -> workshop app driver -> evidence`

The current Journey Mesh packages are private workspace packages, so this repository bootstraps the source checkout at a pinned commit:

```bash
pnpm bootstrap:journey-mesh
pnpm install
```

Pinned commit: `9ef1cd447250a00d330af3f1cc0132a11d5c6a02`.

Before adding executable tests, resolve two integration questions:

1. how selected paths/branch conditions are represented for this branching UJG;
2. which Phase/Step and Observability bindings should be part of the case-study UJG rather than duplicated in test code.
