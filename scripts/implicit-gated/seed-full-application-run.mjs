#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeForwardedArgs } from "./cli-args.mjs";
import { seedFullApplicationRun } from "./full-application-run-utils.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const runsRoot = path.join(repoRoot, "experiments", "implicit-gated", "runs");
const args = normalizeForwardedArgs(process.argv.slice(2));
const runName = args[0];

if (!runName || args.length !== 1) {
  console.error("Usage: pnpm seed:full-application-run -- <run-name>");
  process.exit(1);
}

try {
  const target = seedFullApplicationRun({ repoRoot, runsRoot, runName });
  console.log(`Seeded clean-room run at ${path.relative(repoRoot, target)}.`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
