import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type FlatToken, cssValue, cssVariableName, flattenTokens, resolveAliases } from "./dtcg.ts";

type UjgNode = { "@type": string; "@id": string } & Record<string, unknown>;

type UjgTokenSourceNode = UjgNode & {
  "@type": "TokenSource";
  source: string;
};

type UjgThemeNode = UjgNode & {
  "@type": "Theme";
  tokenSourceRefs: string[];
};

const here = path.dirname(fileURLToPath(import.meta.url));
const ujgPath = path.resolve(here, "../../../ujg/workshop-registration.ujg.jsonld");

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadUjg(): { nodes: UjgNode[] } {
  return readJson(ujgPath) as { nodes: UjgNode[] };
}

function themeName(theme: UjgThemeNode): string {
  const parts = theme["@id"].split(":");
  return parts[parts.length - 1];
}

const FOUNDATION_GROUP_PREFIXES = ["dimension.", "fontFamily.", "fontWeight.", "lineHeight.", "shadow."];

class TokenGraph {
  private readonly tokenSources: Map<string, UjgTokenSourceNode>;
  readonly themes: UjgThemeNode[];
  private readonly sourceTokenCache = new Map<string, FlatToken[]>();

  constructor() {
    const ujg = loadUjg();
    this.tokenSources = new Map(
      ujg.nodes
        .filter((node): node is UjgTokenSourceNode => node["@type"] === "TokenSource")
        .map((node) => [node["@id"], node])
    );
    this.themes = ujg.nodes.filter((node): node is UjgThemeNode => node["@type"] === "Theme");
  }

  tokensForSource(ref: string): FlatToken[] {
    const cached = this.sourceTokenCache.get(ref);
    if (cached) return cached;
    const source = this.tokenSources.get(ref);
    if (!source) throw new Error(`Unknown TokenSource ${ref}`);
    const filePath = path.resolve(path.dirname(ujgPath), source.source);
    const tokens = flattenTokens(readJson(filePath) as Record<string, unknown>);
    this.sourceTokenCache.set(ref, tokens);
    return tokens;
  }

  resolvedTokensForTheme(theme: UjgThemeNode): Map<string, FlatToken> {
    const combined = theme.tokenSourceRefs.flatMap((ref) => this.tokensForSource(ref));
    return resolveAliases(combined);
  }

  foundationSourceId(): string {
    const foundation = [...this.tokenSources.keys()].find((id) => id.includes("foundation"));
    if (!foundation) throw new Error("No foundation TokenSource found.");
    return foundation;
  }
}

export function buildDesignTokensCss(): string {
  const graph = new TokenGraph();
  const blocks: string[] = [];

  const foundationResolved = resolveAliases(graph.tokensForSource(graph.foundationSourceId()));
  const foundationLines = [...foundationResolved.values()]
    .filter((token) => FOUNDATION_GROUP_PREFIXES.some((prefix) => token.path.startsWith(prefix)))
    .map((token) => `  ${cssVariableName(token.path)}: ${cssValue(token)};`);
  blocks.push(`:root {\n${foundationLines.join("\n")}\n}`);

  for (const theme of graph.themes) {
    const resolved = graph.resolvedTokensForTheme(theme);
    const semanticLines = [...resolved.values()]
      .filter((token) => token.path.startsWith("semantic."))
      .map((token) => `  ${cssVariableName(token.path)}: ${cssValue(token)};`);
    blocks.push(`[data-theme="${themeName(theme)}"] {\n${semanticLines.join("\n")}\n}`);
  }

  return `${blocks.join("\n\n")}\n`;
}

export interface DesignTokensManifest {
  themes: { id: string; name: string; semanticPaths: string[] }[];
  foundationGroups: Record<string, string[]>;
}

export function buildDesignTokensManifest(): DesignTokensManifest {
  const graph = new TokenGraph();

  const foundationResolved = resolveAliases(graph.tokensForSource(graph.foundationSourceId()));
  const foundationGroups: Record<string, string[]> = {};
  for (const token of foundationResolved.values()) {
    const group = FOUNDATION_GROUP_PREFIXES.find((prefix) => token.path.startsWith(prefix));
    if (!group) continue;
    const groupName = group.slice(0, -1);
    foundationGroups[groupName] ??= [];
    foundationGroups[groupName].push(token.path);
  }

  const themes = graph.themes.map((theme) => {
    const resolved = graph.resolvedTokensForTheme(theme);
    const semanticPaths = [...resolved.keys()].filter((tokenPath) => tokenPath.startsWith("semantic.")).sort();
    return { id: theme["@id"], name: themeName(theme), semanticPaths };
  });

  return { themes, foundationGroups };
}
