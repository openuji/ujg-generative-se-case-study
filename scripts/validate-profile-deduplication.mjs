#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadRealizationProfile, realizationProfileRelativePath } from "./realization-profile.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const profile = loadRealizationProfile(repoRoot);
const profilePath = path.join(repoRoot, realizationProfileRelativePath);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

const dependencyVersions = Object.values(profile.target_profiles).flatMap((target) => [
  ...Object.values(target.package.dependencies),
  ...Object.values(target.package.dev_dependencies)
]);
const ownedVersions = new Set([
  profile.package_manager.version,
  ...dependencyVersions
]);
const scanned = [
  path.join(repoRoot, "README.md"),
  path.join(repoRoot, "experiments", "full-application-generation", "README.md"),
  ...walk(path.join(repoRoot, "docs", "skills")).filter((file) => file.endsWith(".md") && file !== profilePath),
  ...walk(path.join(repoRoot, "checks")).filter((file) => file.endsWith(".md")),
  ...walk(path.join(repoRoot, "scripts")).filter((file) => file.endsWith(".mjs") && file !== fileURLToPath(import.meta.url))
];

for (const file of scanned) {
  const source = fs.readFileSync(file, "utf8");
  for (const version of ownedVersions) {
    if (source.includes(version)) {
      throw new Error(`${path.relative(repoRoot, file)} duplicates profile-owned version ${version}.`);
    }
  }
}

const consumers = [
  ...walk(path.join(repoRoot, "docs", "skills")).filter((file) => file.endsWith("SKILL.md")),
  ...walk(path.join(repoRoot, "checks")).filter((file) => file.endsWith(".md"))
];
for (const file of consumers) {
  if (!fs.readFileSync(file, "utf8").includes("v1-stack.md")) {
    throw new Error(`${path.relative(repoRoot, file)} does not reference the canonical realization profile.`);
  }
}

console.log(`Validated single-source realization requirements across ${scanned.length} files.`);
