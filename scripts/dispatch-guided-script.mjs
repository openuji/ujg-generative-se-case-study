#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { guidanceModeUsage, parseGuidanceArg } from "./guidance-modes.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [scriptName, ...rawArgs] = process.argv.slice(2);

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!scriptName || scriptName.includes("/") || !scriptName.endsWith(".mjs")) {
  fail("Usage: node scripts/dispatch-guided-script.mjs <script-name.mjs> ... --guidance <implicit-gated|explicit-gated>");
}

let parsed;
try {
  parsed = parseGuidanceArg(rawArgs, `${scriptName} ... --guidance <${guidanceModeUsage}>`);
} catch (error) {
  fail(error.message);
}

const target = path.join(repoRoot, "scripts", parsed.guidance, scriptName);
if (!fs.statSync(target, { throwIfNoEntry: false })?.isFile()) {
  fail(`${scriptName} is not available for ${parsed.guidance}.`);
}

const result = spawnSync(process.execPath, [target, ...parsed.rest], {
  cwd: repoRoot,
  stdio: "inherit"
});

if (result.error) fail(result.error.message);
process.exit(result.status ?? 1);
