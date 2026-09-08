import { describe, expect, it } from "vitest";
import { themeCustomProperties } from "./themeCssProperties.mjs";
import { themeScopeKeys, themeScopeModuleId, themeScopeStylesheet, ujgThemeScopes } from "./themeCssPlugin.mjs";

describe("theme scopes handed to the styling layer", () => {
  it("derives one scope per Theme the graph declares", async () => {
    const keys = await themeScopeKeys();
    expect(keys.length).toBeGreaterThan(1);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("declares every resolved custom property inside each Theme scope", async () => {
    const stylesheet = await themeScopeStylesheet();
    const keys = await themeScopeKeys();

    for (const key of keys) {
      const scope = new RegExp(`\\[data-theme="${key}"\\] \\{([^}]*)\\}`).exec(stylesheet);
      expect(scope, `no scope emitted for ${key}`).not.toBeNull();
      for (const [name, value] of Object.entries(await themeCustomProperties(key))) {
        expect(scope[1]).toContain(`${name}: ${value};`);
      }
    }
  });

  it("also resolves a complete Theme without any scope attribute", async () => {
    const stylesheet = await themeScopeStylesheet();
    const root = /:root \{([^}]*)\}/.exec(stylesheet);
    expect(root).not.toBeNull();
    const [first] = await themeScopeKeys();
    expect(root[1].match(/--[a-z0-9-]+:/g) ?? []).toHaveLength(
      Object.keys(await themeCustomProperties(first)).length
    );
  });

  it("keeps the Themes visually distinguishable and leaks no graph identifier", async () => {
    const stylesheet = await themeScopeStylesheet();
    const scopes = [...stylesheet.matchAll(/\[data-theme="[^"]+"\] \{([^}]*)\}/g)].map((match) => match[1]);
    expect(new Set(scopes).size).toBe(scopes.length);
    expect(stylesheet).not.toContain("urn:");
  });

  it("exposes the scopes to the bundler as one stylesheet module", async () => {
    const plugin = ujgThemeScopes();
    expect(plugin.resolveId(themeScopeModuleId)).toBe(themeScopeModuleId);
    expect(plugin.resolveId("./somewhere-else.css")).toBeUndefined();
    expect(await plugin.load.call({}, "./somewhere-else.css")).toBeUndefined();
    expect(await plugin.load.call({}, themeScopeModuleId)).toBe(await themeScopeStylesheet());
  });
});
