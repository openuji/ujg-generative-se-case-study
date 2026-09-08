---
name: ujg-design-system-structure-realization
description: Realize the structural design system defined by UJG Components, Templates, Surfaces, realizations, slots, and data contracts. Use before tokens or styling; do not implement application flow or visual styling.
---

# UJG Design System Structure Realization

Implement the selected design-system target from the complete UJG. Read
[the v1 stack profile](../ujg-to-design-system-realization/references/v1-stack.md)
before creating package infrastructure.

## Authority and scope

The UJG is authoritative for `Component`, `Template`, `Slot`, `SlotBinding`,
`Surface`, `SurfaceRealization`, and `DataBinding`. Resolve every referenced
`DataSchema` before defining component props or form controls.

Do not change the UJG. Do not add visual styling, design-token values, application
routes, backend behavior, runtime state, condition evaluation, transition
execution, or screenshot-only content. Do not inspect implementation targets
outside the selected run.

Before coding, build a temporary in-memory view of every SurfaceRealization,
SlotBinding, and targetSurfaceRef. Never save this view.

## Source structure

Use this package structure:

```text
components/
  ComponentName/
    ComponentName.tsx
    ComponentName.stories.tsx
templates/
  TemplateName/
    TemplateName.tsx
    TemplateName.stories.tsx
primitives/
  PrimitiveName/
    PrimitiveName.tsx
    PrimitiveName.stories.tsx
generated/
  ds-bindings.manifest.json
```

Create exactly one profile-conformant implementation and one colocated story for every UJG
Component and Template. Reserve `components/` and `templates/` for UJG artifacts;
put only domain-neutral repeated HTML structures in `primitives/`.

## Composition rules

- A UJG Component renders only the content or control represented by that
  Component. It does not import another UJG Component or Template.
- A Template exposes named slot props derived from its UJG Slots and contains no
  journey or domain behavior.
- Preserve every targetSurfaceRef boundary. Compose a target Surface through the
  owning Template slot, never by bypassing it with the realizing Component.
- Preserve one authored Surface and realization for a multi-instance State.
  Representative stories may repeat the realized item Surface, but an aggregate
  content Component must not render the same collection.
- Keep Command-backed affordances distinct from their conditional Transition
  outcomes. Do not create branch-specific controls.
- Do not let copy or a visual treatment create Component or Template identity.

## Data contracts

For a data-bound Component, derive props from the bound external JSON Schema.
Editable controls use the exact schema property names as HTML `name`, implementation value,
and error keys. Validation metadata such as `errors` is not submitted as input.
Do not create a second schema, field dictionary, or checked-in generated type file.

For every data-bound form, add an interaction story that renders a real form,
fills controls by accessible label, serializes `FormData`, and proves the exact
editable key/value contract derived from the schema.

## Isolated inspection

Provide local representative fixtures for isolated inspection. Fixtures are
examples, not journey definitions or backend contracts. Template stories must
assemble representative SurfaceRealizations through the modeled SlotBindings.
Provide the profile-selected non-watch interaction command and production
inspection build command.

## Bindings manifest

Generate `generated/ds-bindings.manifest.json` deterministically. Each artifact
entry contains only:

```json
{
  "ujgRef": "UJG Component or Template identifier",
  "type": "Component or Template",
  "module": "implementation module path",
  "export": "export name"
}
```

Include UJG Components and Templates only. Do not include primitives, Surfaces,
realizations, slots, graph nodes, schemas, tokens, routes, or runtime behavior.
Keep UJG identifiers out of every other implementation file.

## Gate

Before returning:

- prove one module and one story exist for every UJG Component and Template;
- validate bindings parity and absence of extra artifact directories;
- validate SurfaceRealization and SlotBinding composition;
- validate schema-bound form serialization;
- validate that primitives do not import UJG artifacts;
- scan implementation source and stories for UJG identifiers;
- run the profile-selected static and executable structure gates.

Report failures and stop. Do not proceed into token or styling work.
