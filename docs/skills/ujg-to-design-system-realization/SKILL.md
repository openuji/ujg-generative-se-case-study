---
name: ujg-to-design-system-realization
description: Orchestrate a complete design-system realization from a UJG document and visual references through structure, design tokens, styling, verification, and comparable static evaluation. Use for the full design-system workflow, not for application behavior.
---

# UJG to Design System Realization

Build every design system selected by a realization manifest. The UJG owns
presentation identity and composition. Visual references inform appearance only.

## Required inputs

- A UJG JSON-LD document and every resource it references.
- A `ujg-implementation.yaml` realization manifest.
- A directory of visual references.
- The run root whose outputs may be changed.
- An implementation-model label and evaluator-model label. Record JSON `null`
  when the caller cannot supply either value.

Resolve the UJG path and all targets from the manifest. Collect the unique values
of `interfaces[*].design_systems`; do not assume a target name or infer one from
the current repository. Resolve every relative manifest path from the manifest's
directory.

Read [references/v1-stack.md](references/v1-stack.md) before starting. Do not
inspect application or design-system implementations outside the selected run.

## Source boundaries

- Treat every seeded UJG fact and referenced schema as immutable. The token phase
  is the sole exception: it must append newly generated `Theme` and `TokenSource`
  nodes to the run-local UJG without changing any seeded fact.
- Never use an existing implementation as generation evidence.
- Never add UJG structure to match a screenshot.
- Never persist a screen map, realization map, transition table, UJG-derived
  dictionary, generated type/client layer, or trace matrix.
- Temporary in-memory analysis is allowed and must be discarded.
- `generated/ds-bindings.manifest.json` is the only permitted UJG-to-code mapping.
  It contains Component and Template bindings only.
- Keep UJG identifiers out of implementation source, Storybook, CSS, the rendered
  DOM, and public component APIs. The bindings manifest is the only design-system
  exception.

The seeded UJG must not already contain `Theme` or `TokenSource` nodes. If it
does, if the UJG is invalid, if a referenced schema cannot be resolved, or if a
selected design-system target is ambiguous, stop before writing implementation
output.

## Ordered realization

For every selected design-system target, execute these skills in order:

1. [UJG Design System Structure Realization](../ujg-design-system-structure-realization/SKILL.md)
2. [UJG Design Token Realization](../ujg-design-token-realization/SKILL.md)
3. [UJG Design System Styling Realization](../ujg-design-system-styling-realization/SKILL.md)

Do not merge the phases. Each phase has a distinct mutation boundary and gate.
Do not start the next phase if the current phase's required verification fails.
The structure phase reads the token-unrealized UJG. The token phase enriches that
same UJG in place. Styling and application phases consume the enriched UJG as
their immutable authority.

After each passing phase, evaluate the current run using the matching static
rubric:

| Phase | Evaluation rubric | Output stem |
|---|---|---|
| Structure | `checks/design-system-structure.md` | `structure` |
| Tokens | `checks/design-tokens.md` | `tokens` |
| Styling | `checks/design-system-styling.md` | `styling` |

Write only the rubric's final JSON object to
`checks/evaluation/<run-name>/<stem>.<evaluator>.json`. Sanitize the evaluator
label to lowercase ASCII letters, digits, and hyphens. Refuse to overwrite an
existing result; the caller must supply a distinct evaluator label for a repeat.
An evaluation score records quality but is not a conformance gate. A malformed or
missing evaluation result is a workflow failure.

## Handoff

Finish with the prepared design systems, their tests and Storybook surfaces, and
their generated bindings. Report the selected targets, phase verification, and
evaluation result paths. Do not implement domain behavior or any manifest
interface in this skill.
