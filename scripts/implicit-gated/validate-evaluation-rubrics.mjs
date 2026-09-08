#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluationDefinitions, validateEvaluationResult } from "./evaluation-results.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function fail(message) {
  throw new Error(message);
}

function assertShape(template, result, label) {
  if (!template || typeof template !== "object" || Array.isArray(template)) return;
  if (!result || typeof result !== "object" || Array.isArray(result)) fail(`${label} must be an object.`);
  for (const [key, childTemplate] of Object.entries(template)) {
    if (!Object.hasOwn(result, key)) fail(`${label} is missing required field ${key}.`);
    assertShape(childTemplate, result[key], `${label}.${key}`);
  }
}

for (const definition of evaluationDefinitions) {
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
  validateEvaluationResult(result, definition, {
    runName: result.run_id,
    label: definition.fixture
  });
}

console.log(`Validated ${evaluationDefinitions.length} static evaluation rubrics and fixture results.`);
