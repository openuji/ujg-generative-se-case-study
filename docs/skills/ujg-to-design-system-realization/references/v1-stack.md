# Design-system realization stack v1

Use this fixed profile for the first clean-room case-study workflow:

- Node.js 22, with the domain runtime's more precise range left to the realization manifest.
- pnpm 10.14.0.
- React 19.2.8 with TypeScript 7.0.2.
- Vite 8.2.2.
- Tailwind CSS 4.3.3.
- Storybook 10.5.10 using its React/Vite integration.

Pin the generated workspace lockfile. Do not introduce a second framework,
builder, styling system, component explorer, or package manager. This profile is
an implementation constraint, not UJG semantics and not a UJG-to-code mapping.
