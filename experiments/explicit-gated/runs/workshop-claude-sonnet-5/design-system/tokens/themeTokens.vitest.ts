import { describe, expect, it } from "vitest";
import { isAlias } from "./dtcg";
import {
  foundationTokens,
  resolveTheme,
  semanticTokens,
  sharedSourceIds,
  themeCustomProperties,
  themeKeys,
  themes,
  topLevelGroups
} from "./themeTokens";

describe("theme resolution through the graph", () => {
  it("discovers every Theme and its ordered token sources from the graph", () => {
    expect(themes.length).toBeGreaterThan(0);
    for (const theme of themes) {
      expect(theme.sources.length).toBeGreaterThan(0);
      for (const source of theme.sources) expect(source.source.endsWith(".tokens.json")).toBe(true);
    }
  });

  it("selects exactly one shared token source and one unique source per Theme", () => {
    const shared = sharedSourceIds();
    expect(shared.size).toBe(1);
    for (const theme of themes) {
      expect(theme.sources.filter((source) => !shared.has(source.id))).toHaveLength(1);
    }
  });

  it("resolves every alias to a concrete typed value", () => {
    for (const key of themeKeys) {
      const theme = resolveTheme(key);
      expect(theme.tokens.length).toBeGreaterThan(0);
      for (const token of theme.tokens) {
        expect(token.resolvedType.length).toBeGreaterThan(0);
        expect(isAlias(token.resolvedValue)).toBe(false);
      }
    }
  });

  it("keeps the semantic role inventory identical across Themes", () => {
    const inventories = themeKeys.map((key) =>
      semanticTokens(resolveTheme(key))
        .map((token) => token.path)
        .sort()
    );
    for (const inventory of inventories) expect(inventory).toEqual(inventories[0]);
    expect(inventories[0].length).toBeGreaterThan(0);
  });

  it("resolves at least one shared semantic role to a different value per Theme", () => {
    const [first, second] = themeKeys.map((key) => resolveTheme(key));
    const changed = semanticTokens(first).filter((token) => {
      const other = second.byPath.get(token.path);
      return JSON.stringify(other?.resolvedValue) !== JSON.stringify(token.resolvedValue);
    });
    expect(changed.length).toBeGreaterThan(0);
  });

  it("carries visual evidence on every semantic token", () => {
    for (const key of themeKeys) {
      for (const token of semanticTokens(resolveTheme(key))) {
        expect(token.evidence?.confidence).toBeTypeOf("string");
        expect(token.evidence?.screenPaths.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it("exposes foundation groups and semantic groups separately", () => {
    const theme = resolveTheme(themeKeys[0]);
    expect(topLevelGroups(foundationTokens(theme)).length).toBeGreaterThan(1);
    expect(topLevelGroups(semanticTokens(theme))).toContain("color");
  });

  it("serializes type-aware custom properties for every Theme", () => {
    for (const key of themeKeys) {
      const properties = themeCustomProperties(resolveTheme(key));
      const names = Object.keys(properties);
      expect(names.length).toBeGreaterThan(0);
      for (const name of names) expect(name.startsWith("--")).toBe(true);
      expect(properties["--color-surface-canvas"]).toMatch(/^rgb\(/);
    }
  });
});
