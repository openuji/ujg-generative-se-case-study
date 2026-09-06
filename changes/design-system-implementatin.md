Implement the Design System defined in the canonical UJG JSON-LD document for this repository.

Focus only on **structure**. Do not add visual styling.

Use React + TypeScript (+ Vite) and Storybook.

## Source of truth

Derive all required Design System artifacts from the UJG JSON-LD:

- `Component`
- `Template`
- `Slot`
- `SlotBinding`
- `Surface`
- `SurfaceRealization`

Do not invent backend/API behavior, styling, design tokens, routes, runtime state, condition evaluation, transition execution, graph behavior, or additional UJG semantics.

UJG IDs must not leak into React implementation files or Storybook stories. Keep UJG-to-code identity exclusively in generated binding artifacts and validation/generation scripts.

## Surface boundary discipline

Before implementing React files, derive a realization map from the UJG:

- every `SurfaceRealization`;
- every `SlotBinding`;
- every `targetSurfaceRef`.

Preserve that map in the React composition.

A UJG `Component` implementation may render only the domain content or control represented by its own UJG `Component` node. It must not render another modeled `Surface`, instantiate another UJG `Component` or `Template`, or hide a `targetSurfaceRef` boundary behind collection/list props.

When a `SurfaceRealization` has a slot binding whose target is another `Surface`, compose that nested Surface through the owning `Template` slot in stories and examples. Do not bypass the nested Surface by rendering its realizing Component directly in the parent slot.

For `multiInstance` Graph states, keep the implementation aligned with the authored model:

- one stable Surface definition;
- one Surface realization;
- repeated concrete occurrences only in representative fixture rendering.

If an aggregate Surface slots an item Surface, the aggregate content component must not also map over the same domain collection to render item content. The item content belongs in the item Surface realization.

## Required source structure

Use this structure:

```text
components/
  [ComponentName]/
    [ComponentName].tsx
    [ComponentName].stories.tsx

templates/
  [TemplateName]/
    [TemplateName].tsx
    [TemplateName].stories.tsx

primitives/
  [PrimitiveName]/
    [PrimitiveName].tsx
    [PrimitiveName].stories.tsx

generated/
  ds-bindings.manifest.json
```

`components/` is reserved for React implementations of UJG `Component` nodes only.

`templates/` is reserved for React implementations of UJG `Template` nodes only.

`primitives/` is reserved for reusable structural React building blocks that are **not** UJG nodes.

Do not place shared helper files directly under `components/` or `templates/`.

## Components

Create one React implementation and one Storybook story file for every UJG `Component`.

Each UJG Component owns domain-specific interpretation, labels, and data mapping for that component.

Do not hide domain-specific structures in generic shared helpers. If a structure uses domain concepts, domain field names, domain labels, or domain-shaped props, it belongs inside a UJG Component implementation or another explicitly named UJG Component.

Do not use a UJG Component as an aggregate renderer for modeled child Surfaces. If a component receives collection-shaped props, verify that the UJG does not already represent the repeated item as a `Surface` slotted into the aggregate realization. If it does, move item rendering to the slotted item Surface composition and keep the aggregate component to aggregate-only content.

## Primitives

Create reusable primitive components only for repeated structural HTML patterns.

Valid primitives are domain-neutral building blocks such as:

- section layout
- collection/list layout
- article/card structure
- description-list structure
- field-control structure
- action-control structure

Primitive components must not encode domain language, domain labels, domain field names, business concepts, journey concepts, or UJG IDs.

Primitive components may accept generic props such as `title`, `children`, `items`, `terms`, `label`, `value`, `error`, or `disabled`.

Primitive components must have their own Storybook stories under `Primitives/...`.

## Templates

Create one React implementation and one Storybook story file for every UJG `Template`.

Templates should expose named slot props derived from UJG `Slot` nodes.

Templates compose slots only. They must not implement journey flow, condition handling, backend calls, runtime behavior, or graph behavior.

Template stories should render representative SurfaceRealizations by composing UJG Components and Templates according to UJG SlotBindings.

When a template slot is bound to a `targetSurfaceRef`, the story should render the target Surface's realization in that slot. If the target Surface represents a `multiInstance` state, the story may repeat representative fixture occurrences, but the repeated markup must come from the target Surface realization rather than from the aggregate content component.

## Storybook

Create Storybook stories using local fixtures so Primitives, Components, and Templates can be inspected independently.

Group stories by functional purpose where useful:

```text
Primitives/...
Components/[Purpose]
Templates/...
```

Fixtures are only for representative structural rendering. They are not a second journey specification, backend contract, runtime model, or source of UJG semantics.

## Manifest

Generate:

```text
generated/ds-bindings.manifest.json
```

The manifest records the relationship between UJG nodes and generated React artifacts.

Each manifest artifact entry must include:

```json
{
  "ujgRef": "[UJG node id]",
  "type": "[Component or Template]",
  "module": "[React module path]",
  "export": "[React export name]"
}
```

The manifest is generated output, not another source of truth.

The manifest must include UJG Components and UJG Templates only. Do not include primitives.

## Validation

Add or update validation so it checks:

- every UJG Component has exactly one matching component module;
- every UJG Component has a colocated Storybook story;
- every UJG Template has exactly one matching template module;
- every UJG Template has a colocated Storybook story;
- the generated manifest is in sync with the UJG;
- no React source or Storybook story contains UJG IDs;
- no non-folder helper file exists directly under `components/` or `templates/`;
- primitives do not import UJG Components or Templates;
- no UJG Component renders or imports another UJG Component or Template when the UJG composition requires a `targetSurfaceRef` slot;
- no aggregate content component renders a domain collection whose item boundary is already modeled as a slotted Surface.

## Test plan

Run the repository's install, manifest generation, validation, type-check, and Storybook build commands.

Start Storybook and inspect representative Primitive, Component, and Template stories.
