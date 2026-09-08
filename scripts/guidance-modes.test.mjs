import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { parseGuidanceArg, resolveGuidanceRoots } from "./guidance-modes.mjs";

test("resolves run and evaluation roots below the selected guidance mode", () => {
  assert.deepEqual(resolveGuidanceRoots("/repo", "implicit-gated"), {
    runsRoot: path.join("/repo", "experiments", "implicit-gated", "runs"),
    evaluationRoot: path.join("/repo", "checks", "evaluation", "implicit-gated")
  });
  assert.deepEqual(resolveGuidanceRoots("/repo", "explicit-gated"), {
    runsRoot: path.join("/repo", "experiments", "explicit-gated", "runs"),
    evaluationRoot: path.join("/repo", "checks", "evaluation", "explicit-gated")
  });
});

test("requires --guidance and strips it before dispatching to mode-local scripts", () => {
  assert.deepEqual(parseGuidanceArg(["run-a", "--phase", "seed", "--guidance", "implicit-gated"], "usage"), {
    guidance: "implicit-gated",
    rest: ["run-a", "--phase", "seed"]
  });

  assert.throws(() => parseGuidanceArg(["run-a"], "usage"), /Usage: usage/);
  assert.throws(() => parseGuidanceArg(["run-a", "--guidance", "other"], "usage"), /Guidance mode must be one of/);
});
