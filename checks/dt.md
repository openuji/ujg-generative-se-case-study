Evaluate the visual-foundation/design-token implementation in this repository.

This is an evaluation-only task.

Do not modify files.
Do not run repository scripts, builds, tests, Storybook, validators, or package-manager commands.

Evaluate only from static repository evidence so the same evaluator can be used across different models and implementation approaches.

The primary goal is comparison, not exhaustive review.

Use exactly the following 6 quality metrics plus 1 complexity metric.

# 1. Token model quality — 0..5

Evaluate:

- foundation/direct tokens are separated from semantic tokens;
- token values use valid typed representations;
- aliases resolve cleanly;
- semantic tokens describe reusable visual roles;
- unnecessary component-specific tokens are avoided.

Report:

token_model_quality: 0..5

Also report:

- total_token_count
- foundation_token_count
- semantic_token_count
- unresolved_alias_count
- invalid_token_count

# 2. Source-of-truth integrity — 0..5

Evaluate whether token values have one clear durable owner.

Penalize:

- raw visual values duplicated outside canonical token files;
- parallel token catalogs;
- parallel theme-value registries;
- manually duplicated values in Tailwind/config/Storybook.

Do not penalize variable aliases such as:

--color-surface: var(--token-surface)

Report:

source_of_truth_integrity: 0..5

Also report:

- raw_value_leak_count
- parallel_token_catalog_count
- parallel_theme_registry_count

# 3. Theme portability — 0..5

Evaluate:

- light/dark differences are primarily data-driven;
- themes resolve through semantic tokens;
- consumers do not contain repeated theme-specific branches;
- adding another theme would mostly require token data rather than application-code changes.

Do not require UJG for a high score.

Report:

theme_portability: 0..5

Also report:

- theme_count
- hardcoded_theme_branch_count
- data_driven_themes: true | false | null

# 4. Traceability — 0..5

Evaluate whether important token decisions can be traced back to visual references or explicit inference.

For the UJG implementation, inspect DTCG provenance metadata.

Distinguish:

direct
inferred
unclassified

Do not treat dark-theme values as directly evidenced when only light screenshots exist.

Report:

traceability: 0..5

Also report:

- provenance_coverage_ratio
- direct_token_count
- inferred_token_count
- unclassified_token_count
- invalid_reference_count

# 5. Visual-foundation fidelity — 0..5

Evaluate the token foundation against the supplied screenshots.

Do NOT evaluate application-screen similarity because existing Components/Templates are intentionally not styled in this task.

Consider only:

- palette;
- typography;
- spacing;
- radii/borders/elevation;
- semantic visual hierarchy.

Report:

visual_foundation_fidelity: 0..5

Give a short explanation of the strongest and weakest visual match.

# 6. Inspectability — 0..5

Evaluate whether a developer can inspect and understand the token system without reading implementation internals.

Consider:

- token groups are documented visually;
- themes can be compared;
- documentation consumes canonical token data rather than copying values;
- Storybook or an equivalent foundation view exists.

Do not require Storybook specifically for a non-Storybook comparison approach if equivalent inspectability exists.

Report:

inspectability: 0..5

Also report:

- documentation_present: true | false
- documented_group_count
- duplicated_documentation_value_count

# 7. Complexity — descriptive, not part of quality score

Estimate implementation cost from static source.

Report:

complexity:
  minimal | moderate | heavy

Also report where measurable:

- implementation_file_count
- infrastructure_loc
- new_dependency_count

Do NOT reward fewer lines automatically.

Complexity is used later to compare:

quality vs implementation cost

It must not affect the quality score.

# Scope check

Also report one simple scope result:

scope_preserved: PASS | FAIL | UNMEASURABLE

PASS means there is no evidence that this foundation task:

- styled or structurally modified existing product Components/Templates;
- introduced screenshot-only product structure;
- introduced unrelated application behavior.

Use UNMEASURABLE when a trustworthy baseline is unavailable and static evidence cannot prove preservation.

# Optional UJG contract check

If the implementation uses UJG, report separately:

ujg_contract: PASS | FAIL | NOT_APPLICABLE

Check only:

Theme
  -> tokenSourceRefs
  -> TokenSource
  -> source
  -> token manifest

and whether this chain remains the authoritative theme/token-source trace.

This result is NOT part of the primary quality score.

For non-UJG implementations return:

ujg_contract: NOT_APPLICABLE

# Primary score

Calculate:

quality_score =
  mean(
    token_model_quality,
    source_of_truth_integrity,
    theme_portability,
    traceability,
    visual_foundation_fidelity,
    inspectability
  )

Report it both as:

X / 5
X / 100

Do not include complexity or UJG contract compliance in this score.

# Findings

Report at most 5 findings.

Only include findings that materially explain one of the six scores.

Use:

HIGH
MEDIUM
LOW

Avoid minor stylistic observations.

# Required output

Start with:

Evaluation

Quality: X/5 (X/100)
Complexity: minimal | moderate | heavy
Scope preserved: PASS | FAIL | UNMEASURABLE
UJG contract: PASS | FAIL | NOT_APPLICABLE

Then show exactly this table:

| Metric | Score |
|---|---:|
| Token model quality | X/5 |
| Source-of-truth integrity | X/5 |
| Theme portability | X/5 |
| Traceability | X/5 |
| Visual-foundation fidelity | X/5 |
| Inspectability | X/5 |

Then provide:

- 3 strongest aspects;
- up to 5 findings;
- one short comparison-oriented conclusion.

End with exactly one JSON block:

{
  "evaluation_version": "token-foundation-core-v1",
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

Use null whenever static inspection cannot establish a value.

Keep metric definitions and scoring unchanged across all compared implementations.