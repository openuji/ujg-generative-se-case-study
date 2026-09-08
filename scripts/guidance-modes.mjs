import path from "node:path";

export const guidanceModes = Object.freeze(["implicit-gated", "explicit-gated"]);
export const guidanceModeUsage = guidanceModes.join("|");

function fail(message) {
  throw new Error(message);
}

export function assertGuidanceMode(guidance) {
  if (!guidanceModes.includes(guidance)) {
    fail(`Guidance mode must be one of: ${guidanceModes.join(", ")}.`);
  }
  return guidance;
}

export function resolveGuidanceRoots(repoRoot, guidance) {
  assertGuidanceMode(guidance);
  return {
    runsRoot: path.join(repoRoot, "experiments", guidance, "runs"),
    evaluationRoot: path.join(repoRoot, "checks", "evaluation", guidance)
  };
}

export function parseGuidanceArg(args, usage) {
  let guidance;
  const rest = [];
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--guidance") {
      guidance = args[index + 1];
      index += 1;
    } else {
      rest.push(argument);
    }
  }
  if (!guidance) fail(`Usage: ${usage}`);
  assertGuidanceMode(guidance);
  return { guidance, rest };
}
