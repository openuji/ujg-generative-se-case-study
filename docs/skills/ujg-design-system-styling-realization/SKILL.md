---
name: ujg-design-system-styling-realization
description: Apply a prepared UJG Theme and DTCG token system to an existing UJG-derived React design system with Tailwind and Storybook. Use after structure and tokens; do not change UJG semantics or application behavior.
---

# UJG Design System Styling Realization

Style the prepared design system using its existing token foundation. Read
[the v1 stack profile](../ujg-to-design-system-realization/references/v1-stack.md)
before changing styling infrastructure.

## Priority and boundaries

Preserve, in order:

1. UJG semantics, artifact inventory, and composition.
2. Working build/toolchain integration.
3. UJG Theme to TokenSource to DTCG to Tailwind resolution.
4. Reference-supported visual treatment.
5. Mobile-first responsive behavior.

Treat the token-enriched UJG as immutable. Do not change the UJG, Graph, Commands, conditions, effects, routes, runtime
behavior, data contracts, Components, Templates, Slots, SlotBindings, Surfaces,
or SurfaceRealizations. Small DOM changes are allowed only for presentation or
accessibility and cannot add content, actions, or composition boundaries.

References are appearance evidence, not structure. Ignore product-shell or other
visible elements absent from the UJG-derived structure.

## Styling ownership

Use these ownership boundaries:

```text
DTCG tokens          -> visual values
Tailwind v4          -> shared styling/responsive vocabulary
global CSS           -> reset, fonts, Theme scope, focus, reduced motion
primitives           -> reusable domain-neutral patterns
Template CSS module  -> relationships between Template slots
Component CSS module -> internal Component presentation
```

Do not place artifact-specific selectors in global CSS. Do not create empty CSS
modules. Use the canonical Tailwind entry and `@reference` for CSS Modules that
apply shared utilities. Fix missing token-to-Tailwind exposure at the adapter
instead of bypassing it with direct variables or raw values.

Use direct CSS only for mechanics Tailwind cannot reasonably express. Do not
introduce another Theme, token, breakpoint, configuration, or styling system.

## Responsive and reusable behavior

Implement mobile-first base styles and progressively enhance through centralized
Tailwind breakpoints. Never add local pixel media queries. Treat missing reusable
breakpoints or visual values as foundation gaps.

Reuse a primitive only when its semantics and layout fit. Do not distort modeled
composition for primitive convenience. Extract genuinely repeated domain-neutral
layout behavior rather than copying it.

Represent reference-supported treatments of one semantic control as explicit
presentation variants, not new UJG identity. Variants remain one implementation,
use token-backed styling, avoid parent/position selectors, preserve interaction
semantics, and appear in Storybook.

## Fidelity

Implement icons, status symbols, badges, separators, control treatments, and
other presentational details only when they belong to existing UJG-derived
content or interactions. Use available assets or the package's icon mechanism.
Report unavailable assets instead of using empty wells or fake glyphs.

Load actual referenced fonts and apply tokenized typography inside the active
Theme scope. Ensure Storybook Canvas and Docs use the same Tailwind processing,
tokens, CSS, fonts, Theme scope, aliases, and responsive rules as production.
Never branch styling on hardcoded Theme names.

Provide explicit mobile and desktop Storybook views for responsive artifacts and
representative framing for bounded artifacts. Documentation stories obey the same
token and responsive rules.

## Gate

Before returning:

- prove UJG artifact inventory and composition are unchanged;
- run token and styling validation, typecheck, tests, package build, and Storybook
  production build;
- start Storybook development compilation when the environment permits it;
- inspect available rendered artifacts across every Theme and explicit mobile and
  desktop views;
- scan for raw reusable values, local breakpoints, hardcoded Theme branches,
  placeholder visuals, broken aliases, and duplicated styling systems.

Report every unverified render or unavailable asset. Do not implement application
flow or manifest interfaces.
