/**
 * Build-time half of the Theme resolution pipeline.
 *
 *   UJG Theme -> ordered TokenSource references -> DTCG manifests
 *             -> type-aware resolved CSS custom properties
 *
 * `themeTokens.ts` performs the same resolution for bundled consumers by
 * loading the manifests through the bundler. This module reads them straight
 * off disk so a Node build step can emit the custom-property block that the
 * styling adapter will import. It is authored as plain ESM because the
 * design-system package does not carry Node type definitions.
 *
 * The emitted block is build output. It is never written back into the run.
 */

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const evidenceExtension = "org.openuji.visual-evidence";
const aliasPattern = /^\{([^{}]+)\}$/;

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));

/** Default graph location: the run-local UJG document beside this package. */
export const defaultUjgLocation = resolve(packageRoot, "..", "ujg", "workshop-registration.ujg.jsonld");

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function flattenTokens(document, origin, segments = [], inheritedType, inheritedExtensions, output = []) {
  if (!isRecord(document)) return output;
  const type = typeof document.$type === "string" ? document.$type : inheritedType;
  const extensions = isRecord(document.$extensions) ? document.$extensions : inheritedExtensions;

  if (Object.hasOwn(document, "$value")) {
    const evidence = extensions?.[evidenceExtension];
    output.push({
      path: segments.join("."),
      type: type ?? "",
      value: document.$value,
      description: typeof document.$description === "string" ? document.$description : undefined,
      evidence: isRecord(evidence) ? evidence : undefined,
      origin
    });
    return output;
  }

  for (const [key, child] of Object.entries(document)) {
    if (key.startsWith("$")) continue;
    flattenTokens(child, origin, [...segments, key], type, extensions, output);
  }
  return output;
}

function resolveAliases(tokens) {
  const byPath = new Map(tokens.map((token) => [token.path, token]));
  const walk = (token, seen) => {
    if (typeof token.value !== "string" || !aliasPattern.test(token.value)) {
      return { value: token.value, type: token.type };
    }
    const target = aliasPattern.exec(token.value)[1];
    if (seen.has(target)) throw new Error(`DTCG alias cycle at ${target} (from ${token.path}).`);
    const next = byPath.get(target);
    if (next === undefined) throw new Error(`Unresolved DTCG alias ${token.value} referenced by ${token.path}.`);
    const downstream = walk(next, new Set([...seen, target]));
    return { value: downstream.value, type: downstream.type.length > 0 ? downstream.type : token.type };
  };

  const resolved = new Map();
  for (const token of byPath.values()) {
    const outcome = walk(token, new Set([token.path]));
    resolved.set(token.path, { ...token, resolvedValue: outcome.value, resolvedType: outcome.type });
  }
  return resolved;
}

function selectTheme(nodes, name) {
  const wanted = name.trim().toLowerCase();
  const pattern = new RegExp(`(^|[^a-z0-9])${wanted}([^a-z0-9]|$)`, "i");
  const matches = nodes
    .filter((node) => node?.["@type"] === "Theme")
    .filter((node) => pattern.test(`${node["@id"] ?? ""} ${node.label ?? ""}`.toLowerCase()));
  if (matches.length !== 1) throw new Error(`Theme name does not select exactly one Theme: ${name}`);
  return matches[0];
}

/**
 * Read the graph, walk the named Theme's ordered token sources, load every DTCG
 * manifest from disk and resolve the combined alias graph.
 */
export async function loadThemeTokens(themeName, ujgLocation = defaultUjgLocation) {
  const document = JSON.parse(await readFile(ujgLocation, "utf8"));
  const nodes = Array.isArray(document.nodes) ? document.nodes : [];
  const theme = selectTheme(nodes, themeName);
  const sources = new Map(
    nodes.filter((node) => node?.["@type"] === "TokenSource").map((node) => [node["@id"], node])
  );

  const graphDirectory = dirname(ujgLocation);
  const tokens = [];
  for (const ref of theme.tokenSourceRefs) {
    const node = sources.get(ref);
    if (node === undefined) throw new Error(`Theme ${theme["@id"]} selects an unknown token source.`);
    const location = resolve(graphDirectory, node.source);
    const manifest = JSON.parse(await readFile(location, "utf8"));
    tokens.push(...flattenTokens(manifest, { id: node["@id"], label: node.label ?? node.source }));
  }

  return { theme, tokens, resolved: resolveAliases(tokens) };
}

export function toCssValue(type, value) {
  if (isRecord(value) && typeof value.colorSpace === "string" && Array.isArray(value.components)) {
    const channels = value.components.slice(0, 3).map((channel) => Math.round(channel * 255)).join(" ");
    const alpha = value.alpha ?? 1;
    return alpha === 1 ? `rgb(${channels})` : `rgb(${channels} / ${alpha})`;
  }
  if (isRecord(value) && typeof value.value === "number" && typeof value.unit === "string") {
    return `${value.value}${value.unit}`;
  }
  if (type === "fontFamily" && Array.isArray(value)) {
    return value.map((family) => (String(family).includes(" ") ? `"${family}"` : String(family))).join(", ");
  }
  if (type === "shadow" && isRecord(value)) {
    const part = (key) => (isRecord(value[key]) ? toCssValue("dimension", value[key]) : "0");
    const shadowColor = isRecord(value.color) ? toCssValue("color", value.color) : "transparent";
    return `${part("offsetX")} ${part("offsetY")} ${part("blur")} ${part("spread")} ${shadowColor}`;
  }
  if (typeof value === "number" || typeof value === "string") return String(value);
  return JSON.stringify(value);
}

export function toCssCustomPropertyName(tokenPath) {
  return `--${tokenPath.replace(/\./g, "-").replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`;
}

/** Type-aware custom-property declarations for one Theme. */
export async function themeCustomProperties(themeName, ujgLocation = defaultUjgLocation) {
  const { resolved } = await loadThemeTokens(themeName, ujgLocation);
  const declarations = {};
  for (const token of resolved.values()) {
    declarations[toCssCustomPropertyName(token.path)] = toCssValue(token.resolvedType, token.resolvedValue);
  }
  return declarations;
}
