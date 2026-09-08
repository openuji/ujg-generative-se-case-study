import { readFile } from "node:fs/promises";
import path from "node:path";

export async function resolveThemeVariables(documentPath, theme, sources) {
  const variables = {};
  for (const sourceRef of theme.tokenSourceRefs) {
    const source = sources.get(sourceRef);
    if (!source) continue;
    const tokenPath = path.resolve(path.dirname(documentPath), source.source);
    const tokenDocument = JSON.parse(await readFile(tokenPath, "utf8"));
    flattenTokens(tokenDocument, [], variables);
  }
  return variables;
}

function flattenTokens(node, parts, variables) {
  if (Object.hasOwn(node, "$value")) {
    variables[`--${parts.join("-")}`] = serializeValue(node.$value);
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (!key.startsWith("$") && value && typeof value === "object" && !Array.isArray(value)) {
      flattenTokens(value, [...parts, key], variables);
    }
  }
}

function serializeValue(value) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object" && "colorSpace" in value && "components" in value) {
    const [r, g, b] = value.components.map((part) => Math.round(part * 255));
    return value.alpha === undefined ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${value.alpha})`;
  }
  if (value && typeof value === "object" && "value" in value && "unit" in value) {
    return `${value.value}${value.unit}`;
  }
  return String(value);
}
