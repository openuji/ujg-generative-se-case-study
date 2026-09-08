---
name: ujg-to-design-system-realization
description: Coordinate separate structure, token, and styling invocations for a UJG-derived design system. Use to identify and hand off the next design-system phase; this skill does not generate implementation artifacts.
---

# UJG to Design System Realization

Coordinate every design system selected by a realization manifest. The UJG owns
presentation identity and composition. Visual references inform appearance only.
This skill is control-only: do not write realization artifacts.

## Required inputs

- A UJG JSON-LD document and every resource it references.
- A `ujg-implementation.yaml` realization manifest.
- A directory of visual references.
- The run root whose outputs may be changed.
- An implementation-model label.

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
- Keep UJG identifiers out of implementation source, component-explorer content, CSS, the rendered
  DOM, and public component APIs. The bindings manifest is the only design-system
  exception.

The seeded UJG must not already contain `Theme` or `TokenSource` nodes. If it
does, if the UJG is invalid, if a referenced schema cannot be resolved, or if a
selected design-system target is ambiguous, stop before writing implementation
output.

## Isolated handoff

For every selected design-system target, hand off these skills in order:

1. [UJG Design System Structure Realization](../ujg-design-system-structure-realization/SKILL.md)
2. [UJG Design Token Realization](../ujg-design-token-realization/SKILL.md)
3. [UJG Design System Styling Realization](../ujg-design-system-styling-realization/SKILL.md)

Each skill must run in a fresh model invocation against the same run workspace.
Do not execute a leaf skill from this coordinator and do not continue from one
leaf phase into another in the same invocation. If the host cannot start a fresh
invocation, stop and report the exact next skill and phase command.

Before handing off a phase, run
`begin:full-application-phase -- <run-name> --phase <phase>`. Do not start the
next phase if the current phase's required verification fails.
The structure phase reads the token-unrealized UJG. The token phase enriches that
same UJG in place. Styling and application phases consume the enriched UJG as
their immutable authority.

The leaf invocation runs the repository's static phase validation followed by
`verify:full-application-run` for that phase. Both commands load the profile;
never replace them with generated wrapper scripts or claims of success. A passing
executable verifier closes the active phase and unlocks the next one.

Do not evaluate during design-system generation. All four static rubrics run
only after the application phase has passed executable verification.

## Handoff

Report the next leaf skill and stop. After styling verification, hand off the
application skill as a new invocation. Do not implement domain behavior or any
manifest interface in this skill.
