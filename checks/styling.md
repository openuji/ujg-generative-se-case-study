Evaluate the styling implementation in this repository.

This is an EVALUATION-ONLY task.

Do not modify files.
Do not run repository scripts, builds, tests, Storybook, validators, package-manager commands, or application code.

Evaluate from static repository evidence and any already-existing rendered screenshots/previews.

The goal is comparison across different models and implementation approaches, not exhaustive review.

Use exactly the following 6 quality metrics plus 1 descriptive complexity metric.

If something cannot be established reliably from static evidence, return `null`.
Do not invent a value.

# 1. Visual fidelity — 0..5

Evaluate how well the implementation transfers the supplied reference visual language onto the supported UI structure.

Consider:

- typography hierarchy;
- color and surface treatment;
- spacing/density;
- borders/radii/elevation;
- control appearance;
- overall visual hierarchy.

Do NOT penalize the implementation for omitting reference elements that were not part of the supplied structural model.

Do penalize visual treatment that materially departs from the references without reason.

If rendered output is available, prefer it over inferring appearance from CSS.

If no rendered output exists, score from static styling evidence and state that confidence is limited.

Report:

visual_fidelity: 0..5

Also report:

- visual_fidelity_confidence: high | medium | low
- unsupported_reference_element_count

# 2. Token and theme adherence — 0..5

Evaluate whether styling consumes the existing design-token/theme system instead of creating another visual-value system.

Consider:

- colors, spacing, typography, radii, borders, shadows and control dimensions use existing token-backed utilities where appropriate;
- raw visual constants are not duplicated unnecessarily;
- every existing Theme uses the same Component/Template implementation;
- theme differences resolve through token values rather than theme-specific component implementations.

Report:

token_theme_adherence: 0..5

Also report:

- raw_visual_value_leak_count
- hardcoded_theme_branch_count
- theme_specific_component_style_count
- theme_count

Do not count ordinary CSS mechanics such as:

0
100%
auto
1fr
grid/flex mechanics
overflow
positioning

as token leakage.

# 3. Structural and scope preservation — 0..5

Evaluate whether styling preserved the supplied structural implementation.

Consider:

- no unsupported Components or product structure were introduced from screenshots;
- existing Component/Template responsibilities remain intact;
- modeled child elements were not duplicated or absorbed merely for styling;
- styling changes do not introduce new actions, content, navigation, behavior, or journey semantics;
- internal DOM changes remain presentation/accessibility-only.

Report:

structural_scope_preservation: 0..5

Also report:

- unsupported_product_structure_count
- cross_artifact_composition_violation_count
- behavior_introduced_by_styling_count

If a trustworthy pre-styling baseline exists, also report:

- component_inventory_changed
- template_inventory_changed

Otherwise use `null`.

# 4. Responsive quality — 0..5

Evaluate whether styling is genuinely mobile-first and adapts coherently to larger viewports.

Consider:

- base styling represents the small-screen layout;
- larger layouts are progressive enhancements;
- important content remains usable at narrow widths;
- grids, forms, actions and slot layouts adapt rather than overflow or rely on desktop-only assumptions;
- responsive styling does not change semantic structure.

Report:

responsive_quality: 0..5

Also report:

- responsive_artifact_count
- desktop_only_assumption_count
- mobile_first_violation_count

Use static breakpoint/CSS evidence.

Do not claim that a layout renders correctly unless rendered evidence exists.

# 5. Styling modularity — 0..5

Evaluate whether styling is owned at the correct level.

Expected responsibility model:

design tokens
  -> reusable visual values

global.css
  -> universal foundation behavior

primitives
  -> reusable domain-neutral layout behavior

Template.module.css
  -> relationships between Template slots

Component.module.css
  -> internal Component presentation

Consider:

- Component-specific styling is not placed globally;
- Template slot relationships remain in Template styling;
- primitives remain domain-neutral;
- CSS Modules do not absorb sibling/child artifact responsibilities;
- new abstractions exist only where genuinely reused;
- Tailwind/CSS integration is not duplicated unnecessarily.

Report:

styling_modularity: 0..5

Also report:

- global_artifact_specific_selector_count
- misplaced_style_rule_count
- styling_specific_new_primitive_count
- duplicated_style_pattern_count

# 6. Inspectability — 0..5

Evaluate whether the styled system is meaningfully inspectable through Storybook or an equivalent existing documentation surface.

Consider:

- existing Component and Template stories expose the styled implementation;
- themes are represented;
- relevant responsive states/viewports are represented;
- stories reuse the actual styling/token system rather than copying visual values;
- documentation does not become another styling implementation.

Do not require Storybook specifically for an alternative approach if an equivalent inspectable design-system view exists.

Report:

inspectability: 0..5

Also report:

- styled_artifact_documentation_coverage_ratio
- theme_documentation_coverage_ratio
- responsive_documentation_coverage_ratio
- duplicated_documentation_style_value_count

# 7. Complexity — descriptive only

Estimate styling implementation cost.

Report:

complexity:
  minimal | moderate | heavy

Also report where measurable:

- styling_file_count
- styling_loc
- new_primitive_count
- new_dependency_count

Do not include complexity in the quality score.

Less code is not automatically better.

# Separate UJG contract check

If the implementation uses UJG, report:

ujg_contract: PASS | FAIL | NOT_APPLICABLE

Check only that styling did not break the authored UJG contract:

- Component inventory unchanged;
- Template inventory unchanged;
- Slot/SlotBinding composition unchanged;
- Surface/SurfaceRealization composition unchanged;
- existing Theme inventory unchanged;
- styling still resolves from Theme -> TokenSource -> token system;
- no screenshot-only UJG structure was added.

This result is NOT part of the primary quality score.

For a non-UJG implementation return:

ujg_contract: NOT_APPLICABLE

# Primary score

Calculate:

quality_score =
  mean(
    visual_fidelity,
    token_theme_adherence,
    structural_scope_preservation,
    responsive_quality,
    styling_modularity,
    inspectability
  )

Use only measurable metrics in the mean.

Report:

X / 5
X / 100

Complexity and UJG contract do not affect this score.

# Findings

Report at most 5 findings.

Only include findings that materially explain one of the six scores.

Use:

HIGH
MEDIUM
LOW

Every HIGH or MEDIUM finding must include concrete file evidence.

Avoid minor stylistic observations.

# Required output

Start with:

Evaluation

Quality: X/5 (X/100)
Complexity: minimal | moderate | heavy
UJG contract: PASS | FAIL | NOT_APPLICABLE

Then output exactly:

| Metric | Score |
|---|---:|
| Visual fidelity | X/5 |
| Token and theme adherence | X/5 |
| Structural and scope preservation | X/5 |
| Responsive quality | X/5 |
| Styling modularity | X/5 |
| Inspectability | X/5 |

Then provide:

- 3 strongest aspects;
- up to 5 findings;
- one short comparison-oriented conclusion.

End with exactly one fenced `json` block:

{
  "evaluation_version": "ds-styling-core-v1",

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

Use `null` whenever static inspection cannot establish a value.

Keep the evaluation version, six metric definitions, scoring method and metric names unchanged across all compared implementations.