import type { PropsWithChildren } from "react";
import documentSource from "../../ujg/workshop-registration.ujg.jsonld?raw";

export type TokenPrimitive = number | string | boolean;
export type ColorValue = {
  colorSpace: string;
  components: number[];
  alpha?: number;
};
export type DimensionValue = {
  value: number;
  unit: string;
};
export type TokenValue = ColorValue | DimensionValue | TokenPrimitive;
export type TokenTree = Record<string, unknown>;

export type TokenEntry = {
  path: string;
  type: string;
  value: TokenValue;
};

type SourceNode = {
  "@id": string;
  "@type": "TokenSource";
  source: string;
  label?: string;
};

type ThemeNode = {
  "@type": "Theme";
  label?: string;
  tokenSourceRefs: string[];
};

type DocumentModel = {
  nodes: Array<Record<string, unknown>>;
};

export type ThemeOption = {
  name: string;
  label: string;
};

const tokenModules = import.meta.glob<TokenTree>("../../design/tokens/*.tokens.json", {
  eager: true,
  import: "default"
});

const model = JSON.parse(documentSource) as DocumentModel;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sourceKey(modulePath: string) {
  const fileName = modulePath.split("/").pop();
  return fileName ? `../design/tokens/${fileName}` : modulePath;
}

function slug(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return normalized.length > 0 ? normalized : "theme";
}

const sourceTrees = new Map(
  Object.entries(tokenModules).map(([modulePath, tokens]) => [sourceKey(modulePath), tokens])
);

const sourceNodes = new Map(
  model.nodes
    .filter((node): node is SourceNode => node["@type"] === "TokenSource")
    .map((node) => [node["@id"], node])
);

const themeNodes = model.nodes.filter((node): node is ThemeNode =>
  node["@type"] === "Theme" && Array.isArray(node.tokenSourceRefs)
);

export const themeOptions: ThemeOption[] = themeNodes.map((theme, index) => ({
  name: slug(typeof theme.label === "string" ? theme.label : `theme-${index + 1}`),
  label: typeof theme.label === "string" ? theme.label : `Theme ${index + 1}`
}));

export const defaultThemeName = themeOptions[0]?.name ?? "theme";

export function collectTokens(
  node: unknown,
  prefix: string[] = [],
  inheritedType = "",
  output: TokenEntry[] = []
) {
  if (!isRecord(node)) return output;
  const type = typeof node.$type === "string" ? node.$type : inheritedType;

  if (Object.hasOwn(node, "$value")) {
    output.push({
      path: prefix.join("."),
      type,
      value: node.$value as TokenValue
    });
    return output;
  }

  for (const [key, child] of Object.entries(node)) {
    if (!key.startsWith("$")) collectTokens(child, [...prefix, key], type, output);
  }

  return output;
}

export function sourceTokenGroups() {
  return Array.from(sourceTrees.entries()).map(([source, tree]) => ({
    source,
    tokens: collectTokens(tree)
  }));
}

export function tokensForTheme(themeName: string) {
  const themeIndex = Math.max(0, themeOptions.findIndex((theme) => theme.name === themeName));
  const theme = themeNodes[themeIndex];
  if (!theme) return [];

  return theme.tokenSourceRefs.flatMap((ref) => {
    const source = sourceNodes.get(ref);
    const tree = source ? sourceTrees.get(source.source) : undefined;
    return tree ? collectTokens(tree) : [];
  });
}

export function resolveTokenValue(token: TokenEntry, tokens: TokenEntry[], visited = new Set<string>()): TokenValue {
  if (!(typeof token.value === "string" && token.value.startsWith("{") && token.value.endsWith("}"))) {
    return token.value;
  }

  const path = token.value.slice(1, -1);
  if (visited.has(path)) return token.value;
  const target = tokens.find((entry) => entry.path === path);
  return target ? resolveTokenValue(target, tokens, new Set([...visited, path])) : token.value;
}

function tokenVariable(path: string) {
  const kebab = path
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `--${kebab}`;
}

export function formatTokenValue(value: TokenValue) {
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") return value;
  if ("colorSpace" in value) {
    const [red = 0, green = 0, blue = 0] = value.components;
    const alpha = value.alpha ?? 1;
    const channels = [red, green, blue].map((channel) => Math.round(channel * 255));
    return `rgb(${channels[0]} ${channels[1]} ${channels[2]} / ${alpha})`;
  }
  return `${value.value}${value.unit}`;
}

function declarationsFor(themeName: string) {
  const tokens = tokensForTheme(themeName);
  return tokens
    .map((token) => `  ${tokenVariable(token.path)}: ${formatTokenValue(resolveTokenValue(token, tokens))};`)
    .join("\n");
}

export function buildThemeCss() {
  return themeOptions
    .map((theme, index) => {
      const selector = index === 0
        ? `:root,\n[data-theme="${theme.name}"]`
        : `[data-theme="${theme.name}"]`;
      return `${selector} {\n${declarationsFor(theme.name)}\n}`;
    })
    .join("\n\n");
}

export function ThemeStyleProvider({ children, themeName = defaultThemeName }: PropsWithChildren<{ themeName?: string }>) {
  return (
    <>
      <style>{buildThemeCss()}</style>
      <div data-theme={themeName}>{children}</div>
    </>
  );
}
