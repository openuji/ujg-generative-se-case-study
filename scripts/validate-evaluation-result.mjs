#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeForwardedArgs } from "./cli-args.mjs";
import { validateRunPhaseEvaluations } from "./evaluation-results.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = normalizeForwardedArgs(process.argv.slice(2));
if (args.length !== 2) {
  console.error("Usage: pnpm validate:evaluation-result -- <run-name> <structure|tokens|styling|application>");
  process.exit(1);
}

try {
  const files = validateRunPhaseEvaluations(repoRoot, args[0], args[1]);
  console.log(`Validated ${files.length} ${args[1]} evaluation result(s) for ${args[0]}.`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
