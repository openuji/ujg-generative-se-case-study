# Style the UJG-derived Design System

Style the existing UJG-derived React Design System.

The structural Design System and token foundation already exist. This task applies the established visual system to the existing Components and Templates without changing their UJG semantics or composition.

## Decision priority

When requirements appear to conflict, apply them in this order:

1. Preserve UJG semantics and composition.
2. Preserve the repository's working build and toolchain integration.
3. Use the existing TokenSource → tokens → Tailwind v4 system rather than bypassing it.
4. Reproduce reference-supported visual treatment and presentational details.
5. Preserve mobile-first responsive behavior.
6. Reuse primitives and shared patterns only when doing so does not weaken 1–5.
7. Refactoring and cleanup are secondary to correctness and fidelity.

Never satisfy a lower-priority goal by violating a higher-priority one.

Do not introduce new abstractions, tokens, primitives, variants, configuration, or validation merely because this prompt mentions them. Add or change them only when the existing implementation or supplied references require it.

## Sources of truth

Use the canonical UJG document as the source of truth for:

- `Component`
- `Template`
- `Slot`
- `SlotBinding`
- `Surface`
- `SurfaceRealization`
- `Theme`
- `TokenSource`

Use the TokenSources referenced by `Theme.tokenSourceRefs` as the source of truth for visual values.

Use the repository's existing Tailwind CSS v4 setup as the styling vocabulary over those tokens.

Visual references are evidence for appearance and presentation, not a second structural specification.

Expected chain:

```text
UJG Theme
  → TokenSource
  → design tokens
  → Tailwind v4 theme/utilities/breakpoints
  → global.css / primitives / CSS Modules
  → React Components / Templates
```

Do not create a parallel theme, token, breakpoint, style manifest, or mapping system.

## Preflight

Before modifying styling, inspect and understand the repository's existing:

* canonical Tailwind v4 entry point;
* token → Tailwind exposure;
* centralized breakpoints;
* generated token/theme CSS;
* `global.css`;
* Theme scope and Storybook decorators;
* font loading;
* Storybook/Vite integration;
* TypeScript/Vite/Storybook import aliases;
* reusable primitives;
* relevant visual references.

Also identify which reference-supported presentational details belong to which existing Components/Templates.

Do not start by replacing existing infrastructure or inventing a parallel setup.

## Structural boundary

Preserve the existing UJG-derived structure.

Do not add, remove, merge, or split UJG Components, Templates, Slots, SlotBindings, Surfaces, or SurfaceRealizations.

Do not change Graph topology, Commands, conditions, effects, routes, backend/runtime behavior, or journey execution.

Small internal DOM changes are allowed for styling, responsiveness, accessibility, and presentational detail, provided they do not introduce new domain semantics, interactions, or UJG composition boundaries.

If reference structure conflicts with UJG structure:

```text
UJG semantics and composition win.
```

## Styling ownership

Use:

```text
design tokens
  → visual values

Tailwind v4
  → shared styling and responsive vocabulary

global.css
  → universal foundation/integration

primitives
  → reusable domain-neutral patterns

Template.module.css
  → Template-specific slot layout

Component.module.css
  → Component-specific presentation
```

`global.css` is limited to foundation concerns such as Tailwind setup, generated token/theme CSS, font loading, reset/base rules, Theme-scope defaults, focus and reduced-motion behavior.

Do not put artifact-specific composition into global selectors.

Use sibling `.module.css` files for artifact-specific presentation where needed. Do not create empty modules mechanically.

## Tailwind v4 is the implementation vocabulary

CSS Modules provide local style ownership; they must not become an alternative token/styling system.

When Tailwind can express a design value or layout rule, use the repository's Tailwind utility vocabulary.

Prefer:

```css
@reference "<canonical-tailwind-entry>";

.root {
  @apply <existing utilities>;
}
```

over directly consuming generated token variables throughout artifact CSS:

```css
.root {
  padding: var(--...);
  color: var(--...);
}
```
Prefer `<canonical-tailwind-entry>` path by alias typescript infrastructure offers over relative.

If an existing token is not correctly exposed through Tailwind, fix the token → Tailwind exposure rather than bypassing Tailwind in Components/Templates.

Direct CSS is acceptable only for implementation mechanics that cannot reasonably be expressed through the active Tailwind setup. Keep it minimal.

This applies consistently to Components, Templates, primitives, and Storybook documentation.

### CSS Modules and `@reference`

Any `.module.css` using Tailwind directives that require shared theme context must reference the repository's canonical Tailwind entry using Tailwind v4 `@reference`.

Do not guess the entry path.

Do not repeatedly import the global stylesheet into CSS Modules.

Before using a utility with `@apply`, verify that it actually resolves under the active Tailwind/token setup.

## Responsive behavior

Implement styling mobile-first.

Base styling represents the narrow/mobile layout; progressively enhance through the repository's centralized Tailwind breakpoints.

Do not introduce local hard-coded media breakpoints inside Components, Templates, primitives, or Storybook styling.

If a required breakpoint is missing, treat that as a foundation-level gap rather than inventing a local pixel breakpoint.

Reusable design constants such as spacing, max-widths, opacity, typography, radii, borders, shadows, and responsive thresholds should remain token/Tailwind-grounded where appropriate.

Do not tokenize arbitrary CSS mechanics solely to satisfy this rule.

## Primitives and shared layout

Reuse primitives only when their semantics and layout behavior genuinely fit the artifact.

A primitive must not determine or distort Component/Template composition.

Do not use a generic `header`, `footer`, `actions`, `panel`, or similar region merely because its name looks compatible.

Artifact composition wins over primitive convenience.

At the same time, when the same genuinely domain-neutral layout behavior is duplicated across several artifacts, reuse or extract it instead of copying it repeatedly.

This includes repeated action-group, stack, cluster, container, or similar layout behavior when the semantics and responsive behavior are actually the same.

## Presentation variants

One semantic Component or primitive may have multiple visual treatments.

When the reference visual system clearly distinguishes treatments of the same existing control/pattern, implement explicit presentation variants rather than creating new UJG identity.

Variants must:

* remain one semantic implementation;
* be explicit in the implementation API;
* use token-grounded Tailwind styling;
* not depend on DOM position or parent selectors;
* preserve interaction semantics.

Expose meaningful variants in Storybook.

## Reference-supported presentation fidelity

Inspect supplied references systematically.

If an icon, status symbol, badge, separator, illustration, control treatment, or other presentational detail corresponds to content/state/interaction that already exists in the UJG-derived implementation, implement that detail in the owning existing artifact.

Do not omit such details merely because they are not separate UJG nodes.

Use the repository's existing icon mechanism when available.

Do not render fake replacements such as:

* empty icon wells;
* blank circles;
* placeholder glyphs;
* decorative shapes standing in for unavailable content.

If a required presentational asset genuinely cannot be implemented from available repository resources, report the fidelity gap instead of silently omitting or faking it.

Do not use references to invent new actions, content, navigation, application shell, Surfaces, or journey behavior.

## Fonts, Themes, and scope

Font resource loading and tokenized font application are separate requirements. Verify both.

If typography tokens reference a font:

* load the actual repository-provided font resource;
* ensure Storybook loads it too;
* apply tokenized typography at a scope where the active Theme variables actually exist.

Do not assume `body { font-family: var(...) }` works when the variable is defined only on a descendant Theme wrapper.

Expected inheritance:

```text
font resource
  → loaded

Theme scope
  → Theme variables
  → tokenized typography
  → rendered descendants
```

Preserve the existing Theme-scoping model.

Verify this in Storybook Canvas and Docs where both are used.

Do not silently substitute a different font and declare completion.

Do not hard-code Theme-name branches such as:

```ts
theme === "dark" ? ... : ...
```

for styling or token documentation when the behavior should be token-driven, including foundation properties such as `colorScheme`.

If Theme-specific foundation behavior is missing, represent it through the existing Theme/token foundation rather than branching on Theme names in artifacts or documentation.

## Imports

Preserve the repository's established cross-directory aliases.

Do not replace working aliased imports with deep relative paths to work around Vite/Storybook/TypeScript configuration.

Relative imports remain appropriate for colocated siblings such as `.module.css` and local fixtures.

Existing aliases must resolve consistently across TypeScript, Vite, and Storybook.

## Storybook

Storybook is a required runtime and verification surface.

It must receive the same relevant:

* Tailwind processing;
* token/theme CSS;
* global CSS;
* fonts;
* Theme scope;
* aliases.

Both Storybook production build and development compilation must work.

### Explicit responsive inspection

Responsive behavior must be directly inspectable.

For responsive Components/Templates, provide explicit mobile and desktop Storybook inspection using named stories and/or Storybook viewport parameters based on the repository's configured viewports.

Do not rely solely on a reviewer manually resizing the canvas.

### Story framing

Present standalone artifacts at representative dimensions.

Do not allow a normally bounded card/control/content artifact to fill the entire Storybook canvas merely because its preview container is unconstrained.

Use Storybook-only framing where needed. Do not change production composition or add fake application structure.

### Storybook documentation

Token/foundation and documentation stories must follow the same token, Tailwind, Theme, and responsive rules as production artifacts.

They must be mobile-first and responsive.

Do not use fixed desktop-only grids, local hard-coded breakpoints, raw reusable design constants, or hard-coded Theme branches merely because the code is documentation.

## Acceptance gates

Completion requires evidence in three areas.

### 1. Structural correctness

Verify that:

* UJG Component/Template inventory is unchanged;
* SurfaceRealization and SlotBinding composition is unchanged;
* primitives have not altered artifact ownership/composition;
* references have not introduced unsupported semantic structure.

### 2. Integration correctness

Run the repository's existing relevant:

* token generation/validation;
* Tailwind/styling generation;
* type-check/build;
* tests;
* Storybook production build;
* visual regression checks, if already present.

Also start the existing Storybook development server.

Verify that:

* no Vite/Tailwind/CSS transformation errors occur;
* CSS Modules using Tailwind have valid `@reference`;
* all applied utilities resolve;
* token/theme CSS resolves;
* centralized responsive breakpoints are used;
* intended fonts load and are actually applied from the active Theme scope;
* existing aliases still resolve;
* no new parallel styling/configuration system was introduced.

### 3. Rendered visual correctness

Inspect actual rendered Storybook output, not only command exit codes.

Verify representative artifacts across supported Themes and explicit mobile/desktop views.

Confirm that:

* reference-supported icons/status/presentational details are present;
* no fake or empty decorative placeholders remain;
* required visual variants are represented;
* artifact composition is not distorted by generic primitives;
* standalone artifact sizing is representative;
* mobile/desktop behavior is directly inspectable;
* token/foundation documentation is responsive;
* reusable layout behavior is not needlessly duplicated;
* styling uses Tailwind rather than bypassing it with direct token-variable CSS where Tailwind support exists;
* no local hard-coded responsive breakpoints or hard-coded Theme branches remain.

## Definition of done

The task is complete only when:

* existing UJG Components and Templates have the intended visual treatment;
* UJG semantics and composition remain unchanged;
* reference-supported presentational details are implemented or genuine unavailable-asset gaps are reported;
* presentation variants represent visual differences without creating new UJG identity;
* artifact-specific styling remains locally owned;
* reusable layout behavior is shared only where genuinely compatible;
* Tailwind v4 remains the styling and responsive vocabulary;
* CSS Modules using Tailwind compile correctly through `@reference`;
* design values remain grounded in the existing token system;
* fonts are loaded and applied from the actual Theme scope;
* Theme behavior is token-driven rather than hard-coded by Theme name;
* established aliases remain intact;
* mobile and desktop states are explicitly inspectable in Storybook;
* Storybook documentation is also responsive and token-grounded;
* Storybook production build succeeds;
* Storybook development compilation and rendering succeed;
* no parallel theme, token, breakpoint, mapping, or styling system has been introduced.

Do not implement application flow, backend behavior, routing, Graph execution, or new UJG structure in this task.

