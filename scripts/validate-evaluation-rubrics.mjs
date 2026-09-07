#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const definitions = [
  {
    phase: "structure",
    version: "ds-structure-core-v1",
    rubric: "checks/design-system-structure.md",
    fixture: "checks/fixtures/structure.valid.json",
    scores: [
      "artifact_coverage",
      "composition_fidelity",
      "data_contract_fidelity",
      "identity_containment",
      "implementation_modularity",
      "storybook_inspectability"
    ]
  },
  {
    phase: "tokens",
    version: "token-foundation-core-v1",
    rubric: "checks/design-tokens.md",
    fixture: "checks/fixtures/tokens.valid.json",
    scores: [
      "token_model_quality",
      "source_of_truth_integrity",
      "theme_portability",
      "traceability",
      "visual_foundation_fidelity",
      "inspectability"
    ]
  },
  {
    phase: "styling",
    version: "ds-styling-core-v1",
    rubric: "checks/design-system-styling.md",
    fixture: "checks/fixtures/styling.valid.json",
    scores: [
      "visual_fidelity",
      "token_theme_adherence",
      "structural_scope_preservation",
      "responsive_quality",
      "styling_modularity",
      "inspectability"
    ]
  },
  {
    phase: "application",
    version: "application-realization-core-v1",
    rubric: "checks/application-realization.md",
    fixture: "checks/fixtures/application.valid.json",
    scores: [
      "manifest_realization_coverage",
      "ujg_behavioral_fidelity",
      "domain_integrity",
      "interface_design_system_integration",
      "source_of_truth_integrity",
      "verification_coverage"
    ]
  }
];

function fail(message) {
  throw new Error(message);
}

function assertModelLabel(value, label) {
  if (value !== null && (typeof value !== "string" || value.length === 0)) {
    fail(`${label} must be a non-empty string or null.`);
  }
}

function assertShape(template, result, label) {
  if (!template || typeof template !== "object" || Array.isArray(template)) return;
  if (!result || typeof result !== "object" || Array.isArray(result)) fail(`${label} must be an object.`);
  for (const [key, childTemplate] of Object.entries(template)) {
    if (!Object.hasOwn(result, key)) fail(`${label} is missing required field ${key}.`);
    assertShape(childTemplate, result[key], `${label}.${key}`);
  }
}

for (const definition of definitions) {
  const rubricPath = path.join(repoRoot, definition.rubric);
  const fixturePath = path.join(repoRoot, definition.fixture);
  const rubric = fs.readFileSync(rubricPath, "utf8");
  const result = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const jsonBlocks = [...rubric.matchAll(/```json\s*([\s\S]*?)```/g)];
  if (jsonBlocks.length !== 1) fail(`${definition.rubric} must contain exactly one result JSON template.`);
  const template = JSON.parse(jsonBlocks[0][1]);
  assertShape(template, result, definition.fixture);

  for (const requiredText of [
    definition.version,
    `"evaluated_phase": "${definition.phase}"`,
    "Do not execute",
    "only permitted write",
    "Refuse to overwrite",
    "at most five material findings",
    "arithmetic mean of all six scores"
  ]) {
    if (!rubric.includes(requiredText)) fail(`${definition.rubric} is missing: ${requiredText}`);
  }

  if (result.evaluation_version !== definition.version) fail(`${definition.fixture} has the wrong version.`);
  if (result.evaluated_phase !== definition.phase) fail(`${definition.fixture} has the wrong phase.`);
  if (typeof result.run_id !== "string" || result.run_id.length === 0) fail(`${definition.fixture} needs a run_id.`);
  assertModelLabel(result.implementation_model, `${definition.fixture} implementation_model`);
  assertModelLabel(result.evaluator_model, `${definition.fixture} evaluator_model`);

  const actualScoreKeys = Object.keys(result.scores ?? {}).sort();
  const expectedScoreKeys = [...definition.scores].sort();
  if (JSON.stringify(actualScoreKeys) !== JSON.stringify(expectedScoreKeys)) {
    fail(`${definition.fixture} must contain exactly six stable score keys.`);
  }
  const values = definition.scores.map((key) => result.scores[key]);
  if (values.some((value) => typeof value !== "number" || value < 0 || value > 5)) {
    fail(`${definition.fixture} scores must be numbers from 0 through 5.`);
  }

  const expectedFive = Number((values.reduce((sum, value) => sum + value, 0) / 6).toFixed(4));
  const expectedHundred = Number((expectedFive * 20).toFixed(2));
  if (result.quality_score_5 !== expectedFive || result.quality_score_100 !== expectedHundred) {
    fail(`${definition.fixture} quality scores do not match the six-metric arithmetic mean.`);
  }
  if (!["minimal", "moderate", "heavy"].includes(result.complexity?.classification)) {
    fail(`${definition.fixture} has an invalid complexity classification.`);
  }
  if (!Array.isArray(result.findings) || result.findings.length > 5) {
    fail(`${definition.fixture} may contain at most five findings.`);
  }
}

console.log(`Validated ${definitions.length} static evaluation rubrics and fixture results.`);
