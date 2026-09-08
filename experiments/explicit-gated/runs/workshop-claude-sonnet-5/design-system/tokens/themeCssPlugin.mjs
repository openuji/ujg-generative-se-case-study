/**
 * Styling adapter.
 *
 * This is the last link of the Theme pipeline:
 *
 *   UJG Theme -> ordered TokenSource references -> DTCG manifests
 *             -> resolved custom properties (themeCssProperties.mjs)
 *             -> Theme-scoped CSS the styling layer can consume
 *
 * `themeCssProperties.mjs` already resolves a Theme off disk. This module turns
 * that result into a stylesheet and hands it to the bundler as one virtual CSS
 * module, so Storybook, the tests, and the library build all consume the exact
 * same declarations. Nothing is written back into the run.
 *
 * The Theme inventory and the scope selector both come from the graph: a Theme
 * added or renamed in the UJG changes the emitted scopes without an edit here,
 * and no Theme name is ever branched on.
 */

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { defaultUjgLocation, themeCustomProperties } from "./themeCssProperties.mjs";

/** Import specifier for the generated Theme scopes. */
export const themeScopeModuleId = "virtual:ujg-theme-scopes.css";

/** Attribute the scopes key off. The inspection decorator publishes the same one. */
export const themeScopeAttribute = "data-theme";

const themeType = "Theme";
const tokenSourceType = "TokenSource";

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Selector key for a Theme identifier. Mirrors the bundled reader so the
 * attribute values the decorator publishes and the ones emitted here agree.
 */
function slug(identifier) {
  return identifier
    .split(":")
    .filter((segment) => segment.length > 0)
    .slice(-1)[0]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function readGraph(ujgLocation) {
  const document = JSON.parse(await readFile(ujgLocation, "utf8"));
  const nodes = Array.isArray(document.nodes) ? document.nodes.filter(isRecord) : [];
  if (nodes.length === 0) throw new Error("UJG document has no node list.");
  return nodes;
}

/** Every Theme the graph declares, in document order, by selector key. */
export async function themeScopeKeys(ujgLocation = defaultUjgLocation) {
  const keys = (await readGraph(ujgLocation))
    .filter((node) => node["@type"] === themeType)
    .map((node) => slug(String(node["@id"] ?? "")));
  if (keys.length === 0) throw new Error("UJG document declares no Theme.");
  if (new Set(keys).size !== keys.length) throw new Error("UJG Themes do not produce distinct scope keys.");
  return keys;
}

/** Absolute locations of every DTCG manifest the graph selects. */
export async function tokenSourceLocations(ujgLocation = defaultUjgLocation) {
  const graphDirectory = dirname(ujgLocation);
  return (await readGraph(ujgLocation))
    .filter((node) => node["@type"] === tokenSourceType && typeof node.source === "string")
    .map((node) => resolve(graphDirectory, node.source));
}

function block(selector, properties) {
  const declarations = Object.entries(properties)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");
  return `${selector} {\n${declarations}\n}`;
}

/**
 * Theme-scoped custom properties for every Theme in the graph.
 *
 * The first Theme also lands on `:root`, so an unscoped document resolves to a
 * complete Theme instead of to unset properties. Every Theme additionally gets
 * its own attribute scope, which is what switches Themes at runtime.
 */
export async function themeScopeStylesheet(ujgLocation = defaultUjgLocation) {
  const keys = await themeScopeKeys(ujgLocation);
  const blocks = [];
  for (const [index, key] of keys.entries()) {
    const properties = await themeCustomProperties(key, ujgLocation);
    if (Object.keys(properties).length === 0) throw new Error(`Theme ${key} resolves to no tokens.`);
    if (index === 0) blocks.push(block(":root", properties));
    blocks.push(block(`[${themeScopeAttribute}="${key}"]`, properties));
  }
  return `/* Resolved from the UJG Theme nodes and their DTCG token sources. */\n${blocks.join("\n\n")}\n`;
}

/**
 * Bundler wiring. Exposes the resolved Theme scopes as `virtual:ujg-theme-scopes.css`
 * so the styling entry can import them like any other stylesheet.
 */
export function ujgThemeScopes({ ujgLocation = defaultUjgLocation } = {}) {
  return {
    name: "ujg-theme-scopes",
    enforce: "pre",
    resolveId(id) {
      return id === themeScopeModuleId ? themeScopeModuleId : undefined;
    },
    async load(id) {
      if (id !== themeScopeModuleId) return undefined;
      if (typeof this.addWatchFile === "function") {
        this.addWatchFile(ujgLocation);
        for (const location of await tokenSourceLocations(ujgLocation)) this.addWatchFile(location);
      }
      return themeScopeStylesheet(ujgLocation);
    }
  };
}
