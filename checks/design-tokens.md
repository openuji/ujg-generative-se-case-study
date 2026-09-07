# Design-token evaluation

Evaluate the visual-foundation/design-token phase of one clean-room realization
run. This is an evaluation-only, static comparison rubric.

Read the canonical realization and Theme requirements from
`docs/skills/ujg-to-design-system-realization/references/v1-stack.md`. Score the
run against that profile without copying its inventory into this rubric.

## Inputs and mutation boundary

The caller supplies the repository root, run name, implementation-model label,
evaluator-model label, and requested result path. Treat a missing model label as
JSON `null`. Read only the selected run, its UJG and referenced schemas, its
manifest-selected design systems, shared visual references, and already-existing
render/test/build artifacts. You may read the root canonical UJG solely to
compare seeded facts after removing its existing reference-realization `Theme`
and `TokenSource` nodes; do not inspect any root implementation.

Do not inspect the root reference implementation or another run. Do not execute
builds, tests, servers, component explorers, validators, package managers, or application
code. Do not modify implementation files. The only permitted write is the
requested result JSON. Refuse to overwrite it.

Normalize the evaluator filename label by lowercasing it, replacing each run of
non-ASCII-alphanumeric characters with `-`, and stripping leading/trailing `-`.
The canonical path is
`checks/evaluation/<run-name>/tokens.<evaluator>.json`.

## Scoring

Score exactly these six metrics from 0 to 5. Use static absence as evidence; do
not use `null` for a score. Supporting metrics may be `null` when static evidence
cannot establish them.

1. `token_model_quality`: foundation/direct and semantic tokens are separated;
   types are valid DTCG values; aliases resolve; semantic roles are reusable;
   unnecessary component-specific tokens are avoided. Also count total,
   foundation, semantic, unresolved-alias, and invalid tokens.
2. `source_of_truth_integrity`: token files have one durable owner and no raw
   visual values, token catalogues, Theme registries, styling-tool config, or docs
   duplicate canonical data. Generated Theme/TokenSource nodes exist in the
   run-local UJG, point to the generated DTCG sources, and no other seeded UJG
   fact changed. CSS-variable aliases are not duplication. Count raw leaks and
   parallel catalogues/registries.
3. `theme_portability`: Theme differences are data-driven through semantic
   tokens; consumers avoid Theme-specific branches; another Theme would mostly
   require token data. Count Themes and hardcoded branches.
4. `traceability`: important values have valid `direct`, `inferred`, or
   `unclassified` provenance in DTCG `$extensions`; paths resolve to supplied
   references; unsupported variants are not claimed as direct evidence. Count
   and calculate provenance coverage.
5. `visual_foundation_fidelity`: compare only palette, typography, spacing,
   radii/borders/elevation, and semantic hierarchy against references. Do not
   score whole-screen similarity or penalize absent unsupported structure.
6. `inspectability`: canonical token groups and Themes are understandable in
   the profile-selected static documentation surface without copied values.
   Count documented groups and duplicated documentation values.

Calculate `quality_score_5` as the arithmetic mean of all six scores, rounded to
at most four decimal places. `quality_score_100` is that value multiplied by 20,
rounded to at most two decimal places.

Classify complexity separately as `minimal`, `moderate`, or `heavy` from file
count, infrastructure, dependencies, and abstraction burden. Complexity does not
change quality and less code is not automatically better.

Also report:

- `scope_preserved`: `PASS`, `FAIL`, or `UNMEASURABLE`; it passes when the token
  phase changed the UJG only by adding valid Theme/TokenSource nodes and did not
  style/restructure modeled artifacts or invent product behavior.
- `ujg_contract`: `PASS`, `FAIL`, or `NOT_APPLICABLE`; for a UJG run check only
  `Theme -> tokenSourceRefs -> TokenSource -> source -> DTCG manifest` and that
  this chain remains authoritative. This does not change quality.

Report at most five material findings using `HIGH`, `MEDIUM`, or `LOW`, with
each JSON finding represented by `severity`, `summary`, and a non-empty
`evidence` array of repository-relative file locations.

## Required result

Return a short human-readable summary, then end with exactly one fenced JSON
object matching this shape. Write that object alone to the requested result path.

```json
{
  "evaluation_version": "token-foundation-core-v1",
  "run_id": null,
  "evaluated_phase": "tokens",
  "implementation_model": null,
  "evaluator_model": null,
  "quality_score_5": null,
  "quality_score_100": null,
  "scores": {
    "token_model_quality": null,
    "source_of_truth_integrity": null,
    "theme_portability": null,
    "traceability": null,
    "visual_foundation_fidelity": null,
    "inspectability": null
  },
  "complexity": {
    "classification": null,
    "implementation_file_count": null,
    "infrastructure_loc": null,
    "new_dependency_count": null
  },
  "scope_preserved": "UNMEASURABLE",
  "ujg_contract": "NOT_APPLICABLE",
  "metrics": {
    "total_token_count": null,
    "foundation_token_count": null,
    "semantic_token_count": null,
    "unresolved_alias_count": null,
    "invalid_token_count": null,
    "raw_value_leak_count": null,
    "parallel_token_catalog_count": null,
    "parallel_theme_registry_count": null,
    "theme_count": null,
    "hardcoded_theme_branch_count": null,
    "data_driven_themes": null,
    "provenance_coverage_ratio": null,
    "direct_token_count": null,
    "inferred_token_count": null,
    "unclassified_token_count": null,
    "invalid_reference_count": null,
    "documentation_present": null,
    "documented_group_count": null,
    "duplicated_documentation_value_count": null
  },
  "findings": []
}
```

Keep `token-foundation-core-v1`, these six score names, their definitions, and the
arithmetic unchanged across evaluated implementations. Existing evaluation JSON
without run metadata remains legacy baseline data and is not rewritten.
