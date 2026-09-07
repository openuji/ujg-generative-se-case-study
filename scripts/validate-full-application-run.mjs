#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeForwardedArgs } from "./cli-args.mjs";
import { validateFullApplicationRun } from "./full-application-run-utils.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runsRoot = path.join(repoRoot, "experiments", "full-application-generation", "runs");
const args = normalizeForwardedArgs(process.argv.slice(2));
let runName;
let phase = "complete";

for (let index = 0; index < args.length; index += 1) {
  const argument = args[index];
  if (argument === "--phase") {
    phase = args[index + 1];
    index += 1;
  } else if (!argument.startsWith("--") && runName === undefined) {
    runName = argument;
  } else {
    console.error("Usage: pnpm validate:full-application-run -- <run-name> [--phase seed|structure|tokens|styling|application|complete]");
    process.exit(1);
  }
}

if (!runName) {
  console.error("Usage: pnpm validate:full-application-run -- <run-name> [--phase seed|structure|tokens|styling|application|complete]");
  process.exit(1);
}

try {
  const target = validateFullApplicationRun({ repoRoot, runsRoot, runName, phase });
  console.log(`Full-application run is valid for phase ${phase}: ${path.relative(repoRoot, target)}.`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
