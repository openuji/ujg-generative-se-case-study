# Style the UJG-derived Design System

Style the existing UJG-derived React Design System.

The structural Design System and token foundation already exist.

This task is only about **applying the existing visual system to the existing UJG Components and Templates**.

## Sources of truth

Use the canonical UJG document as the source of truth for:

* `Component`
* `Template`
* `Slot`
* `SlotBinding`
* `Surface`
* `SurfaceRealization`
* `Theme`
* `TokenSource`

Use the TokenSources referenced by `Theme.tokenSourceRefs` as the source of truth for visual design values.

Use the repository's existing Tailwind CSS v4 integration as the styling utility layer over those tokens.

If visual references are provided, use them only as styling direction, not as another structural specification.

Expected chain:

```text
UJG Theme
  → TokenSource
  → design tokens
  → Tailwind v4
  → global.css / primitives / CSS Modules
  → React Components / Templates
```

Do not introduce a parallel theme, token, style manifest, or mapping layer.

## Repository integration

Before styling, inspect and preserve the repository's existing:

* Tailwind v4 entry point;
* generated token/theme CSS;
* global CSS loading;
* font loading;
* Storybook/Vite integration;
* TypeScript/Vite/Storybook import aliases.

Extend the existing setup rather than replacing it or creating parallel configuration.

Use established import aliases for cross-directory imports when available.

Use relative imports for colocated files such as:

```ts
./Component.module.css
./fixture
```

Do not introduce a new alias convention solely for this task.

## Tailwind v4 and CSS Modules

CSS Modules using Tailwind directives must have access to the project's Tailwind/theme context.

Identify the canonical Tailwind CSS entry point before editing CSS Modules.

When a `.module.css` uses `@apply` or another Tailwind directive that requires theme context, reference that entry point using Tailwind v4 `@reference`.

Conceptually:

```css
@reference "<project-tailwind-entry>";

.root {
  @apply flex gap-2;
}
```

Resolve the actual reference from the repository. Do not assume a path.

Use `@reference` rather than importing the global stylesheet into every CSS Module.

If a CSS Module does not use Tailwind directives requiring shared context, do not add `@reference` mechanically.

Before using a utility with `@apply`, verify that it exists in the active Tailwind/token setup.

Do not assume example or default utility names exist.

Token values remain the source of truth. Do not duplicate them in CSS Modules or Tailwind configuration.

## Fonts

If typography tokens reference a font family, ensure the corresponding font is actually loaded through the repository's existing font mechanism.

Defining a font-family token is not sufficient.

Font loading must work in Storybook as well as the normal package/application environment.

Do not invent or fetch missing font assets unless they are already provided by the repository.

## Structural freeze

Preserve the existing UJG-derived structure.

Do not add, remove, merge, or split UJG:

* Components;
* Templates;
* Slots;
* SlotBindings;
* Surfaces;
* SurfaceRealizations.

Do not change Graph topology, Commands, conditions, effects, runtime behavior, routing, backend behavior, or journey execution.

Do not introduce UI elements merely because they appear in visual references.

Small internal DOM changes are allowed only when necessary for styling, responsiveness, or accessibility and must not alter UJG composition or semantics.

## Styling ownership

Use this responsibility model:

```text
design tokens
  → reusable visual values

global.css
  → universal foundation behavior

primitives
  → reusable domain-neutral layout behavior

Template.module.css
  → layout/presentation specific to Template slots

Component.module.css
  → presentation internal to one Component
```

Decision rule:

```text
Universal across the Design System?
  → global.css

Reusable domain-neutral structural pattern?
  → primitive

Relationship between Template slots?
  → Template.module.css

Internal presentation of one Component?
  → Component.module.css
```

Do not move styling to a broader scope merely for convenience.

## global.css

Use `global.css` only for genuinely universal foundation behavior.

It may contain or import:

* Tailwind v4 setup;
* generated token/theme CSS;
* font declarations;
* reset/normalize rules;
* box sizing;
* document/body defaults;
* base foreground/background;
* focus-visible defaults;
* reduced-motion behavior;
* other universal foundation rules.

Visual values must resolve from tokens where applicable.

Do not put Component- or Template-specific selectors in `global.css`.

Do not use global sibling/adjacency rules to define composition between UJG artifacts.

The spacing scale may be global; the decision about where spacing applies belongs to the Component, Template, or primitive that owns the layout.

## CSS Modules

When a Component has artifact-specific presentation, colocate it with:

```text
[ComponentName].tsx
[ComponentName].module.css
[ComponentName].stories.tsx
```

When a Template has artifact-specific slot layout, colocate it with:

```text
[TemplateName].tsx
[TemplateName].module.css
[TemplateName].stories.tsx
```

Do not create empty CSS Modules mechanically.

Component CSS owns internal presentation.

Template CSS owns presentation relationships between its slots.

Templates must preserve their Slot and SlotBinding contracts.

Do not duplicate or absorb modeled child Components or Surfaces for styling convenience.

## Primitives

Use existing domain-neutral primitives for genuinely reusable layout behavior.

Introduce new primitives only when a reusable structural pattern occurs repeatedly.

Primitives must remain domain-neutral and must not contain:

* UJG IDs;
* journey semantics;
* business/domain concepts;
* domain labels or field definitions.

Do not create new UJG Components merely for styling reuse.

## Token usage

Use token-grounded Tailwind utilities wherever the visual value is represented by the token system.

Avoid hard-coded visual values when an appropriate token exists, especially:

* colors;
* spacing;
* typography;
* radii;
* borders;
* shadows/elevation;
* control dimensions.

Ordinary CSS layout mechanics do not require tokens.

For example, these may remain implementation-level CSS where appropriate:

```text
0
100%
auto
1fr
minmax(...)
repeat(...)
grid/flex mechanics
positioning
overflow
```

If styling exposes a missing visual value:

1. check whether a suitable token already exists;
2. check whether it is correctly exposed through Tailwind;
3. add/refine a reusable token only when genuinely necessary;
4. avoid one-off visual constants where a reusable semantic value is appropriate.

Do not redesign the token foundation unless a real gap is discovered.

## Mobile-first responsive design

Implement styling **mobile first**.

Base styles target the smallest supported viewport.

Progressively enhance for larger viewports.

Responsive styling may change layout, spacing, wrapping, sizing, alignment, and presentation.

It must not change:

* Component or Template identity;
* Surface ownership;
* SlotBinding ownership;
* actions;
* domain content;
* journey semantics.

Relevant Components and Templates must render appropriately on both mobile and desktop.

## Themes

Support every existing UJG `Theme`.

Do not invent additional Themes.

Theme differences must resolve through the TokenSources referenced by UJG.

Prefer:

```text
one Component
one CSS Module
multiple token resolutions
```

Do not create Theme-specific Component implementations or stylesheets.

## Visual references

If visual references are provided, use them to guide visual characteristics such as:

* hierarchy;
* density;
* typography;
* spacing;
* surfaces;
* controls;
* borders;
* radii;
* elevation;
* responsive relationships.

Do not derive unsupported:

* Components;
* Templates;
* Surfaces;
* navigation;
* application shell;
* actions;
* domain content;
* Graph/journey behavior.

When reference structure conflicts with UJG structure:

```text
UJG structure wins.
```

Transfer the visual language rather than reproducing unsupported screen structure.

## Storybook

Storybook is a required output of this task.

Ensure Storybook receives the same relevant:

* global CSS;
* generated token/theme CSS;
* Tailwind processing;
* font loading;
* theme infrastructure;
* module resolution.

Update existing Component and Template stories to expose the styled Design System.

Relevant stories must work under every applicable UJG Theme and at representative:

```text
mobile
desktop
```

viewports.

Do not create separate mobile/desktop implementations.

Do not invent domain or journey states merely for Storybook.

## Validation and acceptance

Run the repository's existing relevant:

* token generation/validation;
* Tailwind/styling generation;
* type-check/build;
* tests;
* Storybook production build;
* visual regression checks, if already present.

Additionally start the existing Storybook development server and verify representative stories compile and render.

The task is not complete if Storybook has Vite, Tailwind, CSS, import-resolution, or runtime compilation errors introduced by this task.

Verify that:

* Tailwind/token styling is visibly applied;
* every CSS Module using `@apply` has valid Tailwind v4 context through `@reference`;
* every applied Tailwind utility resolves;
* intended fonts are actually loaded;
* every UJG Theme renders;
* mobile and desktop layouts render correctly;
* cross-directory imports follow existing repository conventions;
* UJG Component/Template inventory remains unchanged;
* SurfaceRealization and SlotBinding composition remains unchanged;
* no reference-only structural elements were introduced.

Fix regressions introduced by this task.

Existing unrelated repository warnings are outside the scope of this task.

## Definition of done

The task is complete when:

* existing UJG Components and Templates have the required visual treatment;
* artifact-specific styling is colocated in CSS Modules where needed;
* `global.css` contains only universal foundation behavior;
* Tailwind v4 works correctly from CSS Modules;
* styling resolves through the existing design-token system;
* intended fonts are loaded;
* styling is mobile-first and works on mobile and desktop;
* every existing UJG Theme works;
* both Storybook production build and Storybook development compilation succeed;
* UJG structural composition remains unchanged;
* no parallel theme, token, mapping, or styling system has been introduced.

Do not implement application flow, backend behavior, routing, Graph execution, or new UJG structure in this task.
