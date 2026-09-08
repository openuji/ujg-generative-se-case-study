#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeForwardedArgs } from "./cli-args.mjs";
import { beginFullApplicationPhase } from "./full-application-run-utils.mjs";
import { realizationPhaseUsage } from "./phase-state.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runsRoot = path.join(repoRoot, "experiments", "full-application-generation", "runs");
const args = normalizeForwardedArgs(process.argv.slice(2));
let runName;
let phase;

for (let index = 0; index < args.length; index += 1) {
  if (args[index] === "--phase") {
    phase = args[index + 1];
    index += 1;
  } else if (!args[index].startsWith("--") && runName === undefined) {
    runName = args[index];
  } else {
    console.error(`Usage: pnpm begin:full-application-phase -- <run-name> --phase <${realizationPhaseUsage}>`);
    process.exit(1);
  }
}

if (!runName || !phase) {
  console.error(`Usage: pnpm begin:full-application-phase -- <run-name> --phase <${realizationPhaseUsage}>`);
  process.exit(1);
}

try {
  beginFullApplicationPhase({ repoRoot, runsRoot, runName, phase });
  console.log(`Phase ${phase} is active for ${runName}. Use a fresh realization invocation for this phase only.`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
