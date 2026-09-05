Create the **visual foundation and design-token system** for the existing UJG-derived Design System.

Use the screens in `./workshop-screens` as the visual styling direction.

Before implementation, read this entire brief through the Verification section. Later sections, including **Storybook output**, are required scope, not optional detail.

**Do not style or otherwise modify any existing UJG Component or Template in this task.**

## Authority and boundaries

There are exactly two durable sources of truth:

* the canonical UJG JSON-LD owns Design System identity and structure, including `Theme`, `TokenSource`, and Theme-to-TokenSource ordering through `tokenSourceRefs`;
* the DTCG token manifests own all token values, aliases, token groups, and screenshot provenance.

Everything else is a consumer or adapter.

Tailwind, Storybook, React helpers, and token resolvers may read and resolve the UJG + DTCG model, but they must not create another durable token catalog, theme registry, resolver manifest, style-binding manifest, or second source of token/theme identity.

Consumers may discover token manifests generically, but they must not keep an authored registry of known `TokenSource.source` paths outside the UJG; discovery is only a loading adapter.

Do not commit generated token catalogs such as:

```text
design-system/generated/tokens.ts
design-system/generated/tokens.json
generated theme metadata
generated resolver metadata
generated style binding manifests
```

Resolved values may appear only as transient runtime/build output or as in-memory resolver output. Authored source files outside `design/tokens/*.tokens.json` must not duplicate raw token values derived from the screenshots.

The supplied screenshots are authoritative only as visual evidence for characteristics such as:

* color;
* typography;
* spacing;
* sizing;
* radii;
* borders;
* elevation where evidenced;
* control treatment;
* status treatment;
* surface treatment;
* visual hierarchy.

Do not derive Components, Templates, Surfaces, Commands, navigation, application-shell structure, content, or additional actions from the screenshots.

Elements visible in the screenshots but absent from the UJG-derived structure, such as the global header, project selector, settings/profile controls, tabs, secondary navigation, additional CTAs, or other product-shell elements, must not become implementation requirements.

## UJG Themes and TokenSources

Use the existing UJG Design System `Theme` and `TokenSource` concepts directly.

The deployed/public Design System specification is currently outdated for `TokenSource`.

For this repository, the **active local UJG specification is authoritative**:

```text
TokenSource.source
```

exists and points to the external token manifest.

Use that property directly.

Do not reject or remove `TokenSource.source` because it is absent from the currently deployed public specification.

Do not replace it with:

```text
extensions
manifestRef
path
file
implementationRef
style binding manifests
custom resolver metadata
```

unless another requirement explicitly calls for such a mechanism.

Update the canonical UJG so it defines at least:

```text
Theme: <project-short-name>-light
Theme: <project-short-name>-dark
```
`<project-short-name>` is a placeholder

Each Theme must reference the applicable `TokenSource` nodes using `tokenSourceRefs`.

Use a model equivalent to:

```text
<project-short-name>-light
  -> <project-short-name>-foundation TokenSource
  -> <project-short-name>-light TokenSource

<project-short-name>-dark
  -> <project-short-name>-foundation TokenSource
  -> <project-short-name>-dark TokenSource
```

Each `TokenSource` must use its `source` property to point to the corresponding external token manifest.

Conceptually:

```json
{
  "@type": "TokenSource",
  "@id": "urn:ujg:token-source:<project-short-name>-foundation",
  "source": "design/tokens/<project-short-name>-foundation.tokens.json"
}
```

Keep actual token definitions and values outside the UJG document.

## Token model

Create Design Tokens Community Group compatible token manifests.

Use current DTCG typed value shapes for declared `$type` values. Do not store CSS serialization as the token value just because CSS is the first consumer.

```text
$type: color -> $value is a DTCG color object such as { colorSpace, components, optional alpha/hex }; not "#ffffff" alone
$type: dimension -> $value is { "value": number, "unit": "px" | "rem" }; not "0.75rem"
$type: number -> $value is a JSON number; not "1.1"
$type: shadow -> $value is a DTCG shadow object or array; not a CSS box-shadow string such as "0 12px 32px rgba(...)"
```

Use both **direct/foundation tokens** and **semantic tokens**.

Use:

```text
design/tokens/
  <project-short-name>-foundation.tokens.json
  <project-short-name>-light.tokens.json
  <project-short-name>-dark.tokens.json
```

Foundation/direct tokens should contain reusable raw design decisions such as:

```text
color scales
font families
font sizes
font weights
line heights
spacing scale
radii
border widths
shadows/elevation when justified
```

Semantic tokens should express visual roles such as:

```text
surface.canvas
surface.default
surface.subtle

text.default
text.muted
text.inverse

border.default
border.strong

action.background
action.foreground
action.border

control.background
control.border
control.focus

status.success.*
status.warning.*
status.error.*
```

Semantic tokens should alias/reference foundation tokens where appropriate.

Light and dark Themes should primarily differ through semantic token resolution rather than duplicated Component-specific values.

Do not create component-specific tokens unless a reusable semantic role is insufficient.

## Screenshot provenance

Keep screenshot derivation metadata **inside the DTCG token JSON**, not in the UJG document and not in a separate provenance manifest.

Use DTCG `$extensions` for this informative metadata under a namespaced key such as:

```json
{
  "$extensions": {
    "org.openuji.visual-evidence": {
      "screens": [
        "./<project-short-name>-screens/..."
      ],
      "basis": "What visible property was derived from these references",
      "evidence": "direct",
      "notes": "Optional clarification"
    }
  }
}
```

Add provenance at token or token-group level at the smallest useful granularity.

Do not mechanically repeat the same screenshot list on every token when group-level provenance is sufficient.

If one token group contains both directly evidenced and inferred decisions, put `$extensions` on the relevant subgroup or token. A group-level `direct` claim means every child covered by that extension is directly evidenced.

A file-level or broad group-level `direct` claim is valid only when every covered token and subgroup is directly evidenced.

For mixed semantic manifests, omit the broad `direct` claim or narrow it to the directly evidenced subgroup, then mark inferred roles at token or subgroup level.

Light-theme roles such as hover, focus, inverse, info, and error are `inferred` unless the supplied screenshots directly show that exact role and value. Red destructive or warning treatment does not by itself make `status.error.*` direct.

Distinguish:

```text
direct
```

for exact values and semantic roles visibly evidenced by supplied screens, from:

```text
inferred
```

for design decisions derived from the visual system but not directly visible.

The supplied screenshots represent a light visual direction.

Do not claim direct screenshot evidence for dark-theme values.

Mark dark-theme decisions as inferred/derived from the semantic light foundation where appropriate.

The `$extensions` metadata is informative only.

Token resolution and styling must not depend on it.

## Tailwind v4

The DTCG token manifests are the source of truth for visual token values.

Integrate them with Tailwind CSS v4 using this pipeline:

```text
UJG Theme
  -> TokenSource
  -> TokenSource.source
  -> DTCG token manifest
  -> runtime/build-time resolved CSS custom properties
  -> Tailwind v4 semantic styling
```

Tailwind must consume the token system rather than becoming a second source of token values.

Tailwind source/config may contain only variable aliases or adapter mappings, for example:

```css
--color-surface-canvas: var(--ujg-surface-canvas);
--color-action-background: var(--ujg-action-background);
--spacing-4: var(--ujg-spacing-4);
```

Tailwind source/config must not contain raw colors, spacing values, radii, font sizes, border widths, shadows, or resolved semantic values when those values belong in the DTCG token manifests.

Do not commit generated CSS files that restate all resolved token values as another authored source. If a build tool emits CSS containing resolved values, treat that CSS as build output only.

CSS custom property generation must be type-aware and serialize resolved DTCG values into CSS for each supported token type. Do not stringify token objects generically, for example with `Object.values(...).join(...)`; colors, dimensions, numbers, and shadows require explicit serialization.

Theme switching must resolve the selected UJG Theme through `tokenSourceRefs` and `TokenSource.source`.

Any file-loading mechanism is only an adapter for the `source` value selected through that path, not a second token-source catalog.

Do not hard-code a separate theme list in Storybook, Tailwind, React source, or generated metadata.

Token visualizers must resolve and display values from the currently selected UJG Theme. Local page defaults must not override Storybook theme selection.

Theme switching should change semantic token resolution rather than require theme-specific styling duplicated throughout Components.

Do not apply the generated Tailwind styling to existing Components/Templates in this task.

## Storybook output

Add a first-class visual foundation under:

```text
Tokens/
```

Storybook token stories must be documentation/visualizers over the UJG + DTCG token model. They must read/resolve from UJG `Theme` -> `TokenSource.source` -> DTCG manifests through code, not from generated metadata or duplicated Storybook token data.

Use source-model grouping, not mixed top-level visual categories:

```text
Tokens/Overview
Tokens/Foundation/Colors
Tokens/Foundation/Dimensions
Tokens/Foundation/Typography
Tokens/Foundation/Elevation
Tokens/Semantic/Surfaces
Tokens/Semantic/Text
Tokens/Semantic/Actions
Tokens/Semantic/Controls
Tokens/Semantic/Status
Tokens/Themes
```

Only create stories for token groups that actually exist. Stories should visualise values properly so everybody can see what values mean.

Do not create ambiguous top-level sibling categories such as:

```text
Tokens/Borders
Tokens/Spacing
Tokens/Radius
```

when those pages would mix token types or duplicate foundation groups. Border colors belong with color-oriented semantic groups. Border widths, spacing, and radii belong under `Tokens/Foundation/Dimensions` unless a more precise foundation subgroup is required.

If a semantic group contains multiple token types, show them as sub-sections inside that semantic group, not as competing top-level `Tokens/` siblings.

If one semantic story covers multiple token prefixes, render each prefix as a labeled sub-section rather than one flat mixed grid.

Add a Storybook theme selector for every UJG Theme and make the token stories inspectable under:

```text
<project-short-name>-light
<project-short-name>-dark
```

`Tokens/Themes` should compare resolved semantic roles across Themes. It should not dump or duplicate every foundation token.

Token documentation/visualizers are Storybook infrastructure.

Do not create fake UJG Components merely to visualize tokens.

## Traceability

Preserve this trace:

```text
UJG Theme
  -> UJG TokenSource
  -> TokenSource.source
  -> DTCG token manifest
  -> token/group $extensions visual evidence
  -> runtime/build-time CSS custom properties
  -> Tailwind v4 adapter aliases
  -> Storybook Tokens stories
```

Do not introduce another identity, catalog, or resolution layer between these artifacts.

## Verification

Run the existing repository checks needed to prove the token foundation works.

Do not add or update validation scripts in this task.

At minimum, verify:

```bash
pnpm validate:ujg-design-system
pnpm validate:ds-bindings
pnpm typecheck:design-system
pnpm build:design-system
pnpm build-storybook
```

After building Storybook, manually switch each UJG Theme and confirm the displayed resolved semantic values change, not only the surrounding styling.

Stop when the foundational token system, UJG Theme/TokenSource model, Tailwind v4 integration, and Storybook Tokens foundation are complete.

**Do not style Components or Templates yet.**
