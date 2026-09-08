/**
 * Guards the styling boundaries the package commits to, so a regression shows
 * up as a failing test rather than as a slow visual drift:
 *
 * - no colour is written into a stylesheet; colour only ever arrives through a
 *   Theme-resolved custom property;
 * - no pixel length is written into a stylesheet; the spacing, sizing, radius,
 *   border and type scales are all token-resolved;
 * - no stylesheet declares its own breakpoint; responsive behaviour comes from
 *   the shared breakpoint vocabulary;
 * - every module that reaches for that vocabulary references the one styling
 *   entry rather than setting up a second one.
 */

import { readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const skipped = new Set(["node_modules", "dist", "storybook-static", ".git"]);

async function stylesheets(directory = packageRoot) {
  const entries = await readdir(directory, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    if (skipped.has(entry.name)) continue;
    const location = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await stylesheets(location)));
    else if (extname(entry.name) === ".css") found.push(location);
  }
  return found;
}

async function sheets() {
  const located = await stylesheets();
  return Promise.all(
    located.map(async (location) => ({
      name: relative(packageRoot, location),
      source: await readFile(location, "utf8")
    }))
  );
}

/** Strip comments so prose about a value is never mistaken for a declaration. */
function declarations(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

describe("styling boundaries", () => {
  it("finds the styling entry and at least one module per artifact directory", async () => {
    const names = (await sheets()).map((sheet) => sheet.name);
    expect(names).toContain("styles/global.css");
    for (const directory of ["primitives", "components", "templates"]) {
      expect(names.filter((name) => name.startsWith(`${directory}/`)).length).toBeGreaterThan(0);
    }
  });

  it("writes no colour literal into a stylesheet", async () => {
    for (const { name, source } of await sheets()) {
      expect(declarations(source), name).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(declarations(source), name).not.toMatch(/\b(?:rgba?|hsla?|oklch|oklab|color-mix)\s*\(/);
    }
  });

  it("writes no pixel length into a stylesheet", async () => {
    for (const { name, source } of await sheets()) {
      expect(declarations(source), name).not.toMatch(/\b\d+(?:\.\d+)?px\b/);
    }
  });

  it("declares no breakpoint of its own", async () => {
    for (const { name, source } of await sheets()) {
      expect(declarations(source), name).not.toMatch(/@media[^;{]*(?:min-width|max-width|width\s*[<>])/);
      expect(declarations(source), name).not.toMatch(/@custom-variant\s+(?:sm|md|lg|xl)\b/);
    }
  });

  it("routes every module that uses the shared vocabulary through the one styling entry", async () => {
    for (const { name, source } of await sheets()) {
      if (name === "styles/global.css" || name === "styles/patterns.css") continue;
      if (!/@apply|@variant/.test(declarations(source))) continue;
      expect(source, name).toMatch(/@reference\s+"(?:\.{1,2}\/)+(?:styles\/)?global\.css"/);
    }
  });

  it("keeps every artifact stylesheet non-empty", async () => {
    for (const { name, source } of await sheets()) {
      expect(declarations(source).replace(/\s+/g, ""), name).not.toHaveLength(0);
      expect(declarations(source), name).toMatch(/\{[^}]*\S[^}]*\}/);
    }
  });
});
