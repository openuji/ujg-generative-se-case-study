---
name: ujg-design-token-realization
description: Generate UJG Theme and TokenSource nodes, DTCG token foundations, and Storybook token documentation from a token-unrealized UJG plus visual references. Use after structural realization and before component styling.
---

# UJG Design Token Realization

Create the visual foundation for an already structured UJG-derived design system
and record the generated Theme/TokenSource structure in the run-local UJG.
Read [the v1 stack profile](../ujg-to-design-system-realization/references/v1-stack.md)
before modifying package infrastructure.

## Authority and mutation boundary

- The seeded UJG and schemas own every pre-token semantic and structural fact.
- This skill is the only realization phase allowed to mutate the UJG. It may add
  new `Theme` and `TokenSource` nodes only; it must not modify, remove, reorder,
  or replace any seeded node or document field.
- The generated UJG nodes own Theme and TokenSource identity, Theme ordering, and
  every `TokenSource.source` location after this phase.
- DTCG manifests at those generated locations own token values, aliases, groups,
  and visual evidence metadata.
- Visual references are evidence for color, typography, spacing, dimensions,
  radii, borders, elevation, control/status/surface treatment, and hierarchy only.

Require a valid token-unrealized UJG containing no `Theme` or `TokenSource`
nodes. Do not style existing Components or Templates. Do not derive application
shell, Components, Templates, Surfaces, controls, content, actions, navigation,
or behavior from screenshots.

## Generate the UJG token structure

Infer the smallest useful Theme inventory from distinguishable visual evidence.
If the references show no reliable theme variation, generate one default Theme;
do not invent an unevidenced alternate Theme. Create reusable foundation and
semantic TokenSources as needed, and share a foundation source across Themes
when the evidence supports it.

Mint collision-free UJG identifiers using the document's existing identifier
convention. Each generated `TokenSource` contains only `@type`, `@id`, optional
`label`, and exactly one `source`. Each generated `Theme` contains only `@type`,
`@id`, optional `label`, and a non-empty ordered `tokenSourceRefs`. Every source
must be selected by at least one Theme.

Write DTCG files below the run's `design/tokens/` directory. Store each `source`
as a relative reference resolved from the containing UJG document, normally
`../design/tokens/<generated-name>.tokens.json`. Do not add a Theme registry,
token-source catalogue, or Theme references to Components, Templates, Surfaces,
or other UJG nodes.

After the DTCG files are valid, append the generated TokenSources followed by the
generated Themes to the same run-local UJG. Preserve the complete seeded UJG
verbatim at the data-model level. If the operation cannot complete consistently,
do not leave a partially enriched UJG.

## Token model

Create foundation/direct tokens for reusable raw choices and semantic tokens for
roles such as surfaces, text, borders, actions, controls, and statuses. Prefer
semantic aliases to foundation tokens and Theme-specific semantic resolution.
Avoid component-specific tokens when a reusable role is sufficient.

Use current DTCG typed values:

- colors are DTCG color objects;
- dimensions are numeric value/unit objects;
- numbers are JSON numbers;
- shadows are DTCG shadow objects or arrays;
- aliases use DTCG token references.

Do not serialize CSS strings into typed source values merely because CSS is the
first consumer.

## Visual evidence

Store provenance only in the relevant token or token-group `$extensions` under
`org.openuji.visual-evidence`. Record referenced screen paths, the visual basis,
and `direct` or `inferred` evidence. Use the smallest useful scope.

Do not claim direct evidence for unshown states or for dark-theme decisions when
only light references exist. Evidence metadata is informative and must not affect
resolution.

## Tailwind and Theme resolution

Implement this direct pipeline:

```text
UJG Theme
  -> ordered TokenSource references
  -> TokenSource.source DTCG manifests
  -> type-aware resolved CSS custom properties
  -> Tailwind v4 aliases and utilities
  -> Storybook token visualizers
```

Resolve the newly written relative TokenSource locations from the UJG document.
Do not maintain an authored token-source catalogue or Theme registry elsewhere.
File discovery may load the selected sources but may not become another identity
source.

Tailwind contains variable aliases, not duplicated raw values. Serialize each
DTCG type explicitly. Generated resolved CSS is build output only. Do not commit
generated token catalogues, generated Theme metadata, or resolver manifests.

## Storybook

Create model-driven token visualizers under `Tokens/`, grouped by existing source
groups: overview, foundation groups, semantic groups, and Themes. Only create
pages for groups that exist. Mixed semantic types appear as labeled sections, not
as duplicate top-level categories.

Add a selector for every UJG Theme. Token pages must resolve the selected Theme
through the UJG and its TokenSources. Theme comparison shows semantic roles, not a
full duplicated token dump. Do not create fake UJG Components for documentation.

## Gate

Before returning:

- prove that only Theme/TokenSource nodes were added to the UJG;
- prove that no Theme/TokenSource existed in the phase input;
- validate every UJG Theme and TokenSource reference and source file;
- validate token types, aliases, evidence paths, and Theme resolution;
- confirm no parallel token/Theme registry or raw-value catalogue exists;
- typecheck and build the design-system package;
- run its tests and production Storybook build;
- inspect already-rendered token pages under every Theme when render artifacts are
  available.

Report failures and stop. Leave Component and Template styling unchanged.
