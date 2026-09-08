/**
 * Theme resolution pipeline for bundled consumers (Storybook, tests, and later
 * the styling adapter):
 *
 *   UJG Theme -> ordered TokenSource references -> DTCG manifests -> resolved map
 *
 * The graph document and the DTCG manifests are loaded as raw text and parsed
 * here, so the run's UJG stays the single source of Theme identity and source
 * ordering. Discovery of the manifest files never decides which file a Theme
 * uses; it only makes the graph-selected locations loadable in a bundle.
 */

import ujgSource from "../../ujg/workshop-registration.ujg.jsonld?raw";
import type { FlatToken, ResolvedToken } from "./dtcg";
import { flattenTokens, resolveTokens, toCssCustomPropertyName, toCssValue } from "./dtcg";
import type { ThemeDescriptor, TokenSourceDescriptor } from "./themeModel";
import { findTheme, readThemes } from "./themeModel";

const manifestModules = import.meta.glob("../../design/tokens/*.tokens.json", {
  query: "?raw",
  import: "default",
  eager: true
}) as Record<string, string>;

function fileName(location: string): string {
  const segments = location.split("/");
  return segments[segments.length - 1];
}

const manifestSources = ((): Map<string, string> => {
  const byFile = new Map<string, string>();
  for (const [location, contents] of Object.entries(manifestModules)) {
    const key = fileName(location);
    if (byFile.has(key)) throw new Error(`Ambiguous DTCG manifest file name: ${key}`);
    byFile.set(key, contents);
  }
  return byFile;
})();

function manifestFor(descriptor: TokenSourceDescriptor): unknown {
  const contents = manifestSources.get(fileName(descriptor.source));
  if (contents === undefined) {
    throw new Error(`No DTCG manifest is available for token source ${descriptor.source}.`);
  }
  return JSON.parse(contents);
}

export interface ResolvedThemeSource {
  readonly descriptor: TokenSourceDescriptor;
  readonly tokens: readonly FlatToken[];
}

export interface ResolvedTheme {
  readonly descriptor: ThemeDescriptor;
  readonly sources: readonly ResolvedThemeSource[];
  /** Every token the Theme selects, in token-source order. */
  readonly tokens: readonly ResolvedToken[];
  readonly byPath: ReadonlyMap<string, ResolvedToken>;
}

export const themes: readonly ThemeDescriptor[] = readThemes(JSON.parse(ujgSource));
export const themeKeys: readonly string[] = themes.map((theme) => theme.key);
export const defaultThemeKey: string = themeKeys[0];

const cache = new Map<string, ResolvedTheme>();

/** Resolve one Theme by any name that selects it (its key, identifier, or label). */
export function resolveTheme(name: string): ResolvedTheme {
  const descriptor = findTheme(themes, name);
  const cached = cache.get(descriptor.id);
  if (cached !== undefined) return cached;

  const sources: ResolvedThemeSource[] = descriptor.sources.map((source) => ({
    descriptor: source,
    tokens: flattenTokens(manifestFor(source), { id: source.id, label: source.label })
  }));
  const ordered = sources.flatMap((source) => source.tokens);
  const byPath = resolveTokens(ordered);
  const tokens = ordered
    .map((token) => byPath.get(token.path))
    .filter((token): token is ResolvedToken => token !== undefined);

  const resolved: ResolvedTheme = { descriptor, sources, tokens, byPath };
  cache.set(descriptor.id, resolved);
  return resolved;
}

/** The Theme's shared sources are the ones every other Theme also selects. */
export function sharedSourceIds(): ReadonlySet<string> {
  const perTheme = themes.map((theme) => new Set(theme.sources.map((source) => source.id)));
  const shared = new Set<string>();
  for (const id of perTheme[0] ?? []) {
    if (perTheme.every((set) => set.has(id))) shared.add(id);
  }
  return shared;
}

export function foundationTokens(theme: ResolvedTheme): readonly ResolvedToken[] {
  const shared = sharedSourceIds();
  return theme.tokens.filter((token) => shared.has(token.origin.id));
}

export function semanticTokens(theme: ResolvedTheme): readonly ResolvedToken[] {
  const shared = sharedSourceIds();
  return theme.tokens.filter((token) => !shared.has(token.origin.id));
}

/** Top-level group names present in a token list, in document order. */
export function topLevelGroups(tokens: readonly ResolvedToken[]): string[] {
  const groups: string[] = [];
  for (const token of tokens) {
    const head = token.segments[0];
    if (head !== undefined && !groups.includes(head)) groups.push(head);
  }
  return groups;
}

export function tokensInGroup(tokens: readonly ResolvedToken[], group: string): ResolvedToken[] {
  return tokens.filter((token) => token.path === group || token.path.startsWith(`${group}.`));
}

/** Nested sections inside a group, used to label mixed-type pages. */
export function sectionsInGroup(tokens: readonly ResolvedToken[], group: string): string[] {
  const depth = group.split(".").length;
  const sections: string[] = [];
  for (const token of tokensInGroup(tokens, group)) {
    if (token.segments.length <= depth + 1) continue;
    const section = token.segments.slice(0, depth + 1).join(".");
    if (!sections.includes(section)) sections.push(section);
  }
  return sections;
}

/** Leaves that sit directly in a group rather than in one of its sections. */
export function leavesInGroup(tokens: readonly ResolvedToken[], group: string): ResolvedToken[] {
  const depth = group.split(".").length;
  return tokensInGroup(tokens, group).filter((token) => token.segments.length === depth + 1);
}

/** Type-aware custom properties for one Theme; the styling adapter consumes these. */
export function themeCustomProperties(theme: ResolvedTheme): Record<string, string> {
  const output: Record<string, string> = {};
  for (const token of theme.tokens) {
    output[toCssCustomPropertyName(token.path)] = toCssValue(token.resolvedType, token.resolvedValue);
  }
  return output;
}
