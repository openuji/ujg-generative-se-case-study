#!/usr/bin/env node
import fs from "node:fs";
import { expectedManifest, manifestPath, stableJson } from "./ds-utils.mjs";

const manifest = expectedManifest();
const next = stableJson(manifest);
const check = process.argv.includes("--check");

if (check) {
  const current = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, "utf8") : "";

  if (current !== next) {
    console.error("design-system/generated/ds-bindings.manifest.json is out of sync.");
    process.exit(1);
  }

  console.log("Design-system bindings manifest is in sync.");
} else {
  fs.mkdirSync(new URL("../design-system/generated", import.meta.url), { recursive: true });
  fs.writeFileSync(manifestPath, next);
  console.log("Wrote design-system/generated/ds-bindings.manifest.json.");
}
