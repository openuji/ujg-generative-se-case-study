/**
 * Minimal DTCG reader: flattens a token document into typed leaves and resolves
 * DTCG aliases across an ordered set of documents.
 *
 * The reader is deliberately value-agnostic. It never rewrites a token into a
 * CSS string; serialization for a specific consumer happens downstream.
 */

export const visualEvidenceExtension = "org.openuji.visual-evidence";

export interface VisualEvidence {
  readonly confidence: string;
  readonly screenPaths: readonly string[];
}

export interface DtcgColorValue {
  readonly colorSpace: string;
  readonly components: readonly number[];
  readonly alpha?: number;
}

export interface DtcgDimensionValue {
  readonly value: number;
  readonly unit: string;
}

export interface TokenOrigin {
  readonly id: string;
  readonly label: string;
}

export interface FlatToken {
  readonly path: string;
  readonly segments: readonly string[];
  readonly group: string;
  readonly type: string;
  readonly value: unknown;
  readonly description?: string;
  readonly evidence?: VisualEvidence;
  readonly origin: TokenOrigin;
}

export interface ResolvedToken extends FlatToken {
  readonly resolvedValue: unknown;
  readonly resolvedType: string;
  readonly aliasChain: readonly string[];
}

const aliasPattern = /^\{([^{}]+)\}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isAlias(value: unknown): value is string {
  return typeof value === "string" && aliasPattern.test(value);
}

export function aliasPath(value: string): string {
  const match = aliasPattern.exec(value);
  if (match === null) throw new Error(`Value is not a DTCG alias: ${value}`);
  return match[1];
}

function readEvidence(extensions: Record<string, unknown> | undefined): VisualEvidence | undefined {
  const candidate = extensions?.[visualEvidenceExtension];
  if (!isRecord(candidate)) return undefined;
  const screenPaths = Array.isArray(candidate.screenPaths)
    ? candidate.screenPaths.filter((entry): entry is string => typeof entry === "string")
    : [];
  return {
    confidence: typeof candidate.confidence === "string" ? candidate.confidence : "unknown",
    screenPaths
  };
}

/**
 * Walk a parsed DTCG document. `$type` and `$extensions` declared on a group
 * apply to every descendant leaf that does not restate them.
 */
export function flattenTokens(document: unknown, origin: TokenOrigin): FlatToken[] {
  const output: FlatToken[] = [];

  const walk = (
    node: unknown,
    segments: readonly string[],
    inheritedType: string | undefined,
    inheritedExtensions: Record<string, unknown> | undefined
  ): void => {
    if (!isRecord(node)) return;
    const type = typeof node.$type === "string" ? node.$type : inheritedType;
    const extensions = isRecord(node.$extensions) ? node.$extensions : inheritedExtensions;

    if (Object.hasOwn(node, "$value")) {
      output.push({
        path: segments.join("."),
        segments: [...segments],
        group: segments.slice(0, -1).join("."),
        type: type ?? "",
        value: node.$value,
        description: typeof node.$description === "string" ? node.$description : undefined,
        evidence: readEvidence(extensions),
        origin
      });
      return;
    }

    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith("$")) continue;
      walk(child, [...segments, key], type, extensions);
    }
  };

  walk(document, [], undefined, undefined);
  return output;
}

/**
 * Resolve aliases across an ordered token list. Later entries win, which is how
 * a Theme's ordered token sources layer semantic roles over the foundation.
 */
export function resolveTokens(tokens: readonly FlatToken[]): Map<string, ResolvedToken> {
  const byPath = new Map<string, FlatToken>();
  for (const token of tokens) byPath.set(token.path, token);

  const resolved = new Map<string, ResolvedToken>();

  const walk = (token: FlatToken, seen: readonly string[]): { value: unknown; type: string; chain: string[] } => {
    if (!isAlias(token.value)) return { value: token.value, type: token.type, chain: [] };
    const target = aliasPath(token.value);
    if (seen.includes(target)) {
      throw new Error(`DTCG alias cycle at ${target} (from ${token.path}).`);
    }
    const next = byPath.get(target);
    if (next === undefined) {
      throw new Error(`Unresolved DTCG alias ${token.value} referenced by ${token.path}.`);
    }
    const downstream = walk(next, [...seen, target]);
    return {
      value: downstream.value,
      type: downstream.type.length > 0 ? downstream.type : token.type,
      chain: [target, ...downstream.chain]
    };
  };

  for (const token of byPath.values()) {
    const outcome = walk(token, [token.path]);
    resolved.set(token.path, {
      ...token,
      resolvedValue: outcome.value,
      resolvedType: outcome.type,
      aliasChain: outcome.chain
    });
  }

  return resolved;
}

export function isColorValue(value: unknown): value is DtcgColorValue {
  return isRecord(value) && typeof value.colorSpace === "string" && Array.isArray(value.components);
}

export function isDimensionValue(value: unknown): value is DtcgDimensionValue {
  return isRecord(value) && typeof value.value === "number" && typeof value.unit === "string";
}

/** Type-aware serialization of one resolved token for a CSS custom property. */
export function toCssValue(type: string, value: unknown): string {
  if (isColorValue(value)) {
    const [red = 0, green = 0, blue = 0] = value.components;
    const channels = [red, green, blue].map((channel) => Math.round(channel * 255)).join(" ");
    const alpha = value.alpha ?? 1;
    return alpha === 1 ? `rgb(${channels})` : `rgb(${channels} / ${alpha})`;
  }
  if (isDimensionValue(value)) return `${value.value}${value.unit}`;
  if (type === "fontFamily" && Array.isArray(value)) {
    return value.map((family) => (String(family).includes(" ") ? `"${String(family)}"` : String(family))).join(", ");
  }
  if (type === "shadow" && isRecord(value)) {
    const part = (key: string): string => (isDimensionValue(value[key]) ? toCssValue("dimension", value[key]) : "0");
    const shadowColor = isColorValue(value.color) ? toCssValue("color", value.color) : "transparent";
    return `${part("offsetX")} ${part("offsetY")} ${part("blur")} ${part("spread")} ${shadowColor}`;
  }
  if (typeof value === "number" || typeof value === "string") return String(value);
  return JSON.stringify(value);
}

/** Custom-property name for a token path, e.g. `color.text.primary` -> `--color-text-primary`. */
export function toCssCustomPropertyName(tokenPath: string): string {
  return `--${tokenPath.replace(/\./g, "-").replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`;
}
