import ujgDocumentRaw from "../../ujg/workshop-registration.ujg.jsonld?raw";

const tokenManifestModules = import.meta.glob("../../design/tokens/*.tokens.json", {
  eager: true,
  import: "default",
  query: "?raw"
}) as Record<string, string>;

type JsonObject = Record<string, unknown>;
type TokenValue = string | number | JsonObject | TokenValue[];

export type TokenTheme = {
  id: string;
  name: string;
  tokenSourceRefs: string[];
};

export type TokenSource = {
  id: string;
  name: string;
  source: string;
};

export type FlatToken = {
  path: string;
  type: string;
  value: TokenValue;
  source: string;
  sourceId: string;
  extensions?: JsonObject;
};

export type ResolvedToken = FlatToken & {
  resolvedValue: TokenValue;
  cssValue: string;
  cssVariable: string;
};

export type ResolvedTheme = {
  id: string;
  name: string;
  tokenSources: TokenSource[];
  tokens: ResolvedToken[];
};

const ujgDocument = JSON.parse(ujgDocumentRaw) as { nodes?: JsonObject[] };

function nodeId(node: JsonObject): string {
  return String(node["@id"] ?? "");
}

function nodeName(node: JsonObject): string {
  return String(node.label ?? nodeId(node));
}

function nodeTypes(node: JsonObject): string[] {
  const type = node["@type"];
  return Array.isArray(type) ? type.map(String) : [String(type)];
}

function nodesOfType(type: string): JsonObject[] {
  return (ujgDocument.nodes ?? []).filter((node) => nodeTypes(node).includes(type));
}

export function themeSlug(themeId: string): string {
  return themeId.split(":").at(-1) ?? themeId;
}

export function getTokenSources(): TokenSource[] {
  return nodesOfType("TokenSource").map((node) => {
    const source = node.source;

    if (typeof source !== "string" || source.length === 0) {
      throw new Error(`TokenSource ${nodeId(node)} is missing source.`);
    }

    return {
      id: nodeId(node),
      name: nodeName(node),
      source
    };
  });
}

export function getThemes(): TokenTheme[] {
  return nodesOfType("Theme").map((node) => ({
    id: nodeId(node),
    name: nodeName(node),
    tokenSourceRefs: Array.isArray(node.tokenSourceRefs) ? node.tokenSourceRefs.map(String) : []
  }));
}

export const defaultThemeId = getThemes()[0]?.id ?? "";

export function themeIdFromGlobal(value: unknown): string {
  const themes = getThemes();

  if (typeof value === "string") {
    const matchedTheme = themes.find((theme) => theme.id === value || themeSlug(theme.id) === value);

    if (matchedTheme) {
      return matchedTheme.id;
    }
  }

  return defaultThemeId;
}

function loadTokenManifest(source: string): JsonObject {
  const manifestRaw = Object.entries(tokenManifestModules).find(([modulePath]) => modulePath.endsWith(`/${source}`))?.[1];

  if (!manifestRaw) {
    throw new Error(`No token manifest found for TokenSource.source ${source}.`);
  }

  return JSON.parse(manifestRaw) as JsonObject;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isToken(value: unknown): value is JsonObject {
  return isObject(value) && "$value" in value;
}

function flattenTokenGroup(
  node: JsonObject,
  source: TokenSource,
  pathParts: string[] = [],
  inheritedType?: string,
  inheritedExtensions?: JsonObject
): FlatToken[] {
  const nextType = typeof node.$type === "string" ? node.$type : inheritedType;
  const nextExtensions = isObject(node.$extensions) ? node.$extensions : inheritedExtensions;

  if (isToken(node)) {
    if (!nextType) {
      throw new Error(`Token ${pathParts.join(".")} in ${source.source} is missing $type.`);
    }

    return [
      {
        path: pathParts.join("."),
        type: nextType,
        value: node.$value as TokenValue,
        source: source.source,
        sourceId: source.id,
        extensions: isObject(node.$extensions) ? node.$extensions : nextExtensions
      }
    ];
  }

  return Object.entries(node).flatMap(([key, value]) => {
    if (key.startsWith("$") || !isObject(value)) {
      return [];
    }

    return flattenTokenGroup(value, source, [...pathParts, key], nextType, nextExtensions);
  });
}

function resolveAliasPath(value: TokenValue): string | undefined {
  return typeof value === "string" ? value.match(/^\{([^}]+)\}$/)?.[1] : undefined;
}

function resolveTokenValue(token: FlatToken, tokensByPath: Map<string, FlatToken>, stack: string[] = []): TokenValue {
  const aliasPath = resolveAliasPath(token.value);

  if (!aliasPath) {
    return token.value;
  }

  if (stack.includes(token.path)) {
    throw new Error(`Circular token reference: ${[...stack, token.path].join(" -> ")}`);
  }

  const target = tokensByPath.get(aliasPath);

  if (!target) {
    throw new Error(`Token ${token.path} references missing token ${aliasPath}.`);
  }

  return resolveTokenValue(target, tokensByPath, [...stack, token.path]);
}

function serializeDimension(value: unknown): string {
  if (!isObject(value) || typeof value.value !== "number" || typeof value.unit !== "string") {
    throw new Error(`Invalid DTCG dimension value: ${JSON.stringify(value)}`);
  }

  return `${value.value}${value.unit}`;
}

function serializeColor(value: unknown): string {
  if (!isObject(value) || value.colorSpace !== "srgb" || !Array.isArray(value.components)) {
    throw new Error(`Invalid DTCG color value: ${JSON.stringify(value)}`);
  }

  const alpha = typeof value.alpha === "number" ? value.alpha : 1;

  if (typeof value.hex === "string" && alpha >= 1) {
    return value.hex;
  }

  const [red = 0, green = 0, blue = 0] = value.components.map((component) =>
    Math.round(Number(component) * 255)
  );

  return `rgb(${red} ${green} ${blue} / ${alpha})`;
}

function serializeFontFamily(value: unknown): string {
  const family = Array.isArray(value) ? value : [value];

  return family
    .map((entry) => String(entry))
    .map((entry) => (/[\s,]/.test(entry) ? JSON.stringify(entry) : entry))
    .join(", ");
}

function serializeShadowLayer(value: unknown): string {
  if (!isObject(value)) {
    throw new Error(`Invalid DTCG shadow layer: ${JSON.stringify(value)}`);
  }

  const inset = value.inset === true ? "inset " : "";
  const offsetX = serializeDimension(value.offsetX);
  const offsetY = serializeDimension(value.offsetY);
  const blur = serializeDimension(value.blur);
  const spread = value.spread ? `${serializeDimension(value.spread)} ` : "";
  const color = serializeColor(value.color);

  return `${inset}${offsetX} ${offsetY} ${blur} ${spread}${color}`.trim();
}

function serializeShadow(value: unknown): string {
  return (Array.isArray(value) ? value : [value]).map(serializeShadowLayer).join(", ");
}

export function serializeTokenValue(type: string, value: TokenValue): string {
  switch (type) {
    case "color":
      return serializeColor(value);
    case "dimension":
      return serializeDimension(value);
    case "fontFamily":
      return serializeFontFamily(value);
    case "number":
      if (typeof value !== "number") {
        throw new Error(`Invalid DTCG number value: ${JSON.stringify(value)}`);
      }

      return String(value);
    case "shadow":
      return serializeShadow(value);
    default:
      if (typeof value === "string" || typeof value === "number") {
        return String(value);
      }

      throw new Error(`Unsupported token type ${type}.`);
  }
}

export function tokenCssVariable(path: string): string {
  return `--ujg-${path.replaceAll(".", "-")}`;
}

export function resolveTheme(themeId: string = defaultThemeId): ResolvedTheme {
  const themes = getThemes();
  const theme = themes.find((candidate) => candidate.id === themeId) ?? themes[0];

  if (!theme) {
    throw new Error("No UJG Theme nodes are available.");
  }

  const sourcesById = new Map(getTokenSources().map((source) => [source.id, source]));
  const themeSources = theme.tokenSourceRefs.map((sourceRef) => {
    const source = sourcesById.get(sourceRef);

    if (!source) {
      throw new Error(`Theme ${theme.id} references missing TokenSource ${sourceRef}.`);
    }

    return source;
  });

  const tokensByPath = new Map<string, FlatToken>();

  for (const source of themeSources) {
    for (const token of flattenTokenGroup(loadTokenManifest(source.source), source)) {
      tokensByPath.set(token.path, token);
    }
  }

  const tokens = [...tokensByPath.values()]
    .map((token) => {
      const resolvedValue = resolveTokenValue(token, tokensByPath);
      const cssValue = serializeTokenValue(token.type, resolvedValue);

      return {
        ...token,
        resolvedValue,
        cssValue,
        cssVariable: tokenCssVariable(token.path)
      };
    })
    .sort((left, right) => left.path.localeCompare(right.path));

  return {
    id: theme.id,
    name: theme.name,
    tokenSources: themeSources,
    tokens
  };
}

export function themeCssProperties(themeId: string = defaultThemeId): Record<string, string> {
  return Object.fromEntries(resolveTheme(themeId).tokens.map((token) => [token.cssVariable, token.cssValue]));
}

export function filterTokens(tokens: ResolvedToken[], prefixes: string[], source?: "foundation" | "semantic"): ResolvedToken[] {
  return tokens.filter((token) => {
    const matchesPrefix = prefixes.some((prefix) => token.path === prefix || token.path.startsWith(`${prefix}.`));
    const matchesSource =
      source === undefined ||
      (source === "foundation" ? token.source.includes("-foundation.") : !token.source.includes("-foundation."));

    return matchesPrefix && matchesSource;
  });
}

export function evidenceLabel(token: ResolvedToken): string {
  const evidence = token.extensions?.["org.openuji.visual-evidence"];

  if (!isObject(evidence)) {
    return "unspecified";
  }

  return typeof evidence.evidence === "string" ? evidence.evidence : "unspecified";
}
