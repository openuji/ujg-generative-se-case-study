import fs from "node:fs";
import path from "node:path";

const runNamePattern = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export const evaluationDefinitions = [
  {
    phase: "structure",
    stem: "structure",
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
    stem: "tokens",
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
    stem: "styling",
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
    stem: "application",
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

export function sanitizeEvaluatorLabel(value) {
  if (typeof value !== "string") return "";
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function fail(message) {
  throw new Error(message);
}

function modelLabel(value, label) {
  if (value !== null && (typeof value !== "string" || value.length === 0)) {
    fail(`${label} must be a non-empty string or null.`);
  }
}

function assertRunName(runName) {
  if (!runNamePattern.test(runName)) fail("Evaluation run name is invalid.");
}

export function validateEvaluationResult(result, definition, { runName, label }) {
  if (!result || typeof result !== "object" || Array.isArray(result)) fail(`${label} must be an object.`);
  if (result.evaluation_version !== definition.version) fail(`${label} has the wrong evaluation_version.`);
  if (result.evaluated_phase !== definition.phase) fail(`${label} has the wrong evaluated_phase.`);
  if (result.run_id !== runName) fail(`${label} must identify run ${runName}.`);
  modelLabel(result.implementation_model, `${label}.implementation_model`);
  modelLabel(result.evaluator_model, `${label}.evaluator_model`);

  const actualScoreKeys = Object.keys(result.scores ?? {}).sort();
  const expectedScoreKeys = [...definition.scores].sort();
  if (JSON.stringify(actualScoreKeys) !== JSON.stringify(expectedScoreKeys)) {
    fail(`${label} must contain exactly the six stable score keys.`);
  }
  const scores = definition.scores.map((key) => result.scores[key]);
  if (scores.some((score) => typeof score !== "number" || score < 0 || score > 5)) {
    fail(`${label} scores must be numbers from 0 through 5.`);
  }
  const expectedFive = Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(4));
  const expectedHundred = Number((expectedFive * 20).toFixed(2));
  if (result.quality_score_5 !== expectedFive || result.quality_score_100 !== expectedHundred) {
    fail(`${label} quality scores do not match their arithmetic mean.`);
  }
  if (!result.complexity || !["minimal", "moderate", "heavy"].includes(result.complexity.classification)) {
    fail(`${label} has an invalid complexity classification.`);
  }
  if (!Array.isArray(result.findings) || result.findings.length > 5) {
    fail(`${label} may contain at most five findings.`);
  }
  for (const [index, finding] of result.findings.entries()) {
    if (!finding || !["HIGH", "MEDIUM", "LOW"].includes(finding.severity) ||
        typeof finding.summary !== "string" || finding.summary.length === 0 ||
        !Array.isArray(finding.evidence)) {
      fail(`${label}.findings[${index}] is malformed.`);
    }
    if (["HIGH", "MEDIUM"].includes(finding.severity) && finding.evidence.length === 0) {
      fail(`${label}.findings[${index}] requires evidence.`);
    }
  }
}

export function writeEvaluationResult(repoRoot, { runName, phase, evaluator, result }) {
  assertRunName(runName);
  const definition = evaluationDefinitions.find((candidate) => candidate.phase === phase);
  if (!definition) fail(`Unknown evaluation phase ${phase}.`);
  const evaluatorLabel = sanitizeEvaluatorLabel(evaluator);
  if (!evaluatorLabel) fail("Evaluator label is empty after sanitization.");
  validateEvaluationResult(result, definition, { runName, label: `${phase} evaluation` });
  const directory = path.join(repoRoot, "checks", "evaluation", runName);
  fs.mkdirSync(directory, { recursive: true });
  const target = path.join(directory, `${definition.stem}.${evaluatorLabel}.json`);
  fs.writeFileSync(target, `${JSON.stringify(result, null, 2)}\n`, { flag: "wx" });
  return target;
}

function validatedEvaluationFiles(repoRoot, runName) {
  assertRunName(runName);
  const directory = path.join(repoRoot, "checks", "evaluation", runName);
  if (!fs.statSync(directory, { throwIfNoEntry: false })?.isDirectory()) {
    fail(`Completed run is missing evaluation directory checks/evaluation/${runName}.`);
  }

  const names = fs.readdirSync(directory);
  const patterns = evaluationDefinitions.map((definition) => ({
    definition,
    pattern: new RegExp(`^${definition.stem}\\.([a-z0-9]+(?:-[a-z0-9]+)*)\\.json$`)
  }));
  for (const name of names) {
    if (!patterns.some(({ pattern }) => pattern.test(name))) {
      fail(`Evaluation result has a non-canonical filename: checks/evaluation/${runName}/${name}.`);
    }
  }

  const byPhase = new Map(evaluationDefinitions.map((definition) => [definition.phase, []]));
  for (const { definition, pattern } of patterns) {
    const matches = names.filter((name) => pattern.test(name));
    for (const name of matches) {
      const filePath = path.join(directory, name);
      let result;
      try {
        result = JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch (error) {
        fail(`${path.relative(repoRoot, filePath)} is not valid JSON: ${error.message}`);
      }
      validateEvaluationResult(result, definition, {
        runName,
        label: path.relative(repoRoot, filePath)
      });
      byPhase.get(definition.phase).push(filePath);
    }
  }
  return byPhase;
}

export function validateRunPhaseEvaluations(repoRoot, runName, phase) {
  const definition = evaluationDefinitions.find((candidate) => candidate.phase === phase);
  if (!definition) fail(`Unknown evaluation phase ${phase}.`);
  const files = validatedEvaluationFiles(repoRoot, runName).get(phase);
  if (files.length === 0) fail(`Run is missing a ${phase} evaluation.`);
  return files;
}

export function validateCompletedRunEvaluations(repoRoot, runName) {
  const byPhase = validatedEvaluationFiles(repoRoot, runName);
  for (const definition of evaluationDefinitions) {
    if (byPhase.get(definition.phase).length === 0) {
      fail(`Completed run is missing a ${definition.phase} evaluation.`);
    }
  }
}
