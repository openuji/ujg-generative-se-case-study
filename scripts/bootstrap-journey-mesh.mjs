import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const repo = "https://github.com/openuji/journey-mesh.git";
const commit = "9ef1cd447250a00d330af3f1cc0132a11d5c6a02";
const target = resolve(".vendor/journey-mesh");

if (existsSync(target)) {
  console.log(`Journey Mesh already exists at ${target}`);
  process.exit(0);
}

mkdirSync(dirname(target), { recursive: true });
execFileSync("git", ["clone", "--no-checkout", repo, target], { stdio: "inherit" });
execFileSync("git", ["-C", target, "checkout", commit], { stdio: "inherit" });
console.log(`Journey Mesh pinned to ${commit}`);
