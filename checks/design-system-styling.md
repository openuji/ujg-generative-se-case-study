# Design-system styling evaluation

Evaluate the styling phase of one clean-room realization run. This is an
evaluation-only, static comparison rubric.

Read the canonical realization and Theme requirements from
`docs/skills/ujg-to-design-system-realization/references/v1-stack.md`. Score the
run against that profile without restating its stack or Theme inventory.

## Inputs and mutation boundary

The caller supplies the repository root, run name, implementation-model label,
evaluator-model label, and requested result path. Treat a missing model label as
JSON `null`. Read only the selected run, its UJG and schemas, manifest-selected
design systems, shared visual references, and already-existing screenshots,
component-explorer output, test output, or build artifacts.

Do not inspect the root reference implementation or another run. Do not execute
builds, tests, servers, component explorers, validators, package managers, or application
code. Do not modify implementation files. The only permitted write is the
requested result JSON. Refuse to overwrite it.

The run-local UJG at this phase must already contain the token-phase-generated
Theme/TokenSource nodes and is immutable during styling.

Normalize the evaluator filename label by lowercasing it, replacing each run of
non-ASCII-alphanumeric characters with `-`, and stripping leading/trailing `-`.
The canonical path is
`checks/evaluation/<run-name>/styling.<evaluator>.json`.

## Scoring

Score exactly these six metrics from 0 to 5. Use static absence as evidence; do
not use `null` for a score. Supporting metrics may be `null` when static evidence
cannot establish them. Prefer existing rendered evidence over CSS inference and
report confidence honestly.

1. `visual_fidelity`: reference-supported typography, palette/surfaces, spacing,
   density, borders/radii/elevation, controls, and hierarchy transfer to the
   modeled structure. Do not penalize omitted reference content absent from the
   UJG.
2. `token_theme_adherence`: reusable values consume the profile-selected DTCG/Theme/styling
   pipeline, without raw-value duplication, hardcoded Theme branches, or
   Theme-specific artifact implementations. Do not count CSS mechanics such as
   zero, percentages, auto, fractions, layout, overflow, or positioning.
3. `structural_scope_preservation`: styling preserves Components, Templates,
   Slots, Surface composition, data contracts, actions, content, navigation, and
   behavior; DOM changes are presentational/accessibility-only.
4. `responsive_quality`: base styling is mobile-first and larger layouts enhance
   progressively through shared breakpoints without overflow, desktop-only
   assumptions, or semantic restructuring. Do not claim rendered correctness
   without existing rendered evidence.
5. `styling_modularity`: DTCG owns values; global CSS owns universal foundation;
   primitives own domain-neutral reused patterns; Template modules own slot
   relationships; Component modules own internal presentation. Penalize global
   artifact selectors, misplaced ownership, and unjustified duplication.
6. `inspectability`: actual styled artifacts, Themes, and relevant responsive
   views are inspectable in the profile-selected static documentation
   surface without a duplicate styling system.

Calculate `quality_score_5` as the arithmetic mean of all six scores, rounded to
at most four decimal places. `quality_score_100` is that value multiplied by 20,
rounded to at most two decimal places.

Classify complexity separately as `minimal`, `moderate`, or `heavy` from styling
file count, LOC, primitives, dependencies, and abstraction burden. Complexity
does not change quality and less code is not automatically better.

Report `ujg_contract` as `PASS`, `FAIL`, or `NOT_APPLICABLE`. For a UJG run,
check only that artifact/Theme inventory, SlotBindings, SurfaceRealizations, and
Theme-to-TokenSource resolution remain intact and no screenshot-only UJG
structure was added. It does not change quality.

Report at most five material findings using `HIGH`, `MEDIUM`, or `LOW`; every
JSON finding has `severity`, `summary`, and an `evidence` array of
repository-relative file locations. HIGH and MEDIUM evidence must be non-empty.

## Required result

Return a short human-readable summary, then end with exactly one fenced JSON
object matching this shape. Write that object alone to the requested result path.

```json
{
  "evaluation_version": "ds-styling-core-v1",
  "run_id": null,
  "evaluated_phase": "styling",
  "implementation_model": null,
  "evaluator_model": null,
  "quality_score_5": null,
  "quality_score_100": null,
  "scores": {
    "visual_fidelity": null,
    "token_theme_adherence": null,
    "structural_scope_preservation": null,
    "responsive_quality": null,
    "styling_modularity": null,
    "inspectability": null
  },
  "visual_fidelity_confidence": null,
  "complexity": {
    "classification": null,
    "styling_file_count": null,
    "styling_loc": null,
    "new_primitive_count": null,
    "new_dependency_count": null
  },
  "ujg_contract": "NOT_APPLICABLE",
  "metrics": {
    "unsupported_reference_element_count": null,
    "raw_visual_value_leak_count": null,
    "hardcoded_theme_branch_count": null,
    "theme_specific_component_style_count": null,
    "theme_count": null,
    "unsupported_product_structure_count": null,
    "cross_artifact_composition_violation_count": null,
    "behavior_introduced_by_styling_count": null,
    "component_inventory_changed": null,
    "template_inventory_changed": null,
    "responsive_artifact_count": null,
    "desktop_only_assumption_count": null,
    "mobile_first_violation_count": null,
    "global_artifact_specific_selector_count": null,
    "misplaced_style_rule_count": null,
    "styling_specific_new_primitive_count": null,
    "duplicated_style_pattern_count": null,
    "styled_artifact_documentation_coverage_ratio": null,
    "theme_documentation_coverage_ratio": null,
    "responsive_documentation_coverage_ratio": null,
    "duplicated_documentation_style_value_count": null
  },
  "findings": []
}
```

Keep `ds-styling-core-v1`, these six score names, their definitions, and the
arithmetic unchanged across evaluated implementations. Existing evaluation JSON
without run metadata remains legacy baseline data and is not rewritten.
