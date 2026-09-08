export interface FlatToken {
  path: string;
  type: string;
  value: unknown;
}

interface DtcgNode {
  $type?: string;
  $value?: unknown;
  [key: string]: unknown;
}

export function flattenTokens(node: DtcgNode, prefix: string[] = [], inheritedType?: string): FlatToken[] {
  const type = (node.$type as string | undefined) ?? inheritedType;
  if (Object.hasOwn(node, "$value")) {
    return [{ path: prefix.join("."), type: type ?? "unknown", value: node.$value }];
  }
  const tokens: FlatToken[] = [];
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    tokens.push(...flattenTokens(child as DtcgNode, [...prefix, key], type));
  }
  return tokens;
}

export function resolveAliases(tokens: FlatToken[]): Map<string, FlatToken> {
  const byPath = new Map(tokens.map((token) => [token.path, token]));

  function resolve(token: FlatToken, seen: Set<string>): FlatToken {
    if (typeof token.value === "string" && /^\{[^{}]+\}$/.test(token.value)) {
      const ref = token.value.slice(1, -1);
      if (seen.has(ref)) throw new Error(`Alias cycle at ${ref}`);
      const target = byPath.get(ref);
      if (!target) throw new Error(`Unresolved alias ${token.value} at ${token.path}`);
      const resolvedTarget = resolve(target, new Set([...seen, ref]));
      return { path: token.path, type: token.type, value: resolvedTarget.value };
    }
    return token;
  }

  const resolved = new Map<string, FlatToken>();
  for (const token of tokens) {
    resolved.set(token.path, resolve(token, new Set([token.path])));
  }
  return resolved;
}

interface DtcgColor {
  colorSpace: string;
  components: number[];
  alpha?: number;
}

interface DtcgDimension {
  value: number;
  unit: string;
}

interface DtcgShadow {
  color: DtcgColor;
  offsetX: DtcgDimension;
  offsetY: DtcgDimension;
  blur: DtcgDimension;
  spread: DtcgDimension;
}

function colorToCss(color: DtcgColor): string {
  const [r, g, b] = color.components.map((component) => Math.round(component * 255));
  return `rgb(${r} ${g} ${b} / ${color.alpha ?? 1})`;
}

function dimensionToCss(dimension: DtcgDimension): string {
  return `${dimension.value}${dimension.unit}`;
}

export function cssValue(token: FlatToken): string {
  const { type, value } = token;
  if (type === "color") return colorToCss(value as DtcgColor);
  if (type === "dimension") return dimensionToCss(value as DtcgDimension);
  if (type === "fontFamily") {
    const families = Array.isArray(value) ? value : [String(value)];
    return families.map((family) => (String(family).includes(" ") ? `"${family}"` : family)).join(", ");
  }
  if (type === "shadow") {
    const shadow = value as DtcgShadow;
    return `${dimensionToCss(shadow.offsetX)} ${dimensionToCss(shadow.offsetY)} ${dimensionToCss(shadow.blur)} ${dimensionToCss(shadow.spread)} ${colorToCss(shadow.color)}`;
  }
  return String(value);
}

export function cssVariableName(tokenPath: string): string {
  return `--ds-${tokenPath.replace(/\./g, "-")}`;
}
