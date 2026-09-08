import { describe, expect, it } from "vitest";
import { loadThemeTokens, themeCustomProperties, toCssCustomPropertyName, toCssValue } from "./themeCssProperties.mjs";

describe("build-time theme resolution from disk", () => {
  it("walks the graph-declared token sources in order", async () => {
    const { theme, tokens } = await loadThemeTokens("light");
    expect(theme.tokenSourceRefs.length).toBeGreaterThan(1);
    expect(tokens.length).toBeGreaterThan(0);
    const origins = [...new Set(tokens.map((token) => token.origin.id))];
    expect(origins).toEqual(theme.tokenSourceRefs);
  });

  it("emits type-aware custom properties that differ between Themes", async () => {
    const light = await themeCustomProperties("light");
    const dark = await themeCustomProperties("dark");
    expect(Object.keys(light)).toEqual(Object.keys(dark));
    const changed = Object.keys(light).filter((name) => light[name] !== dark[name]);
    expect(changed.length).toBeGreaterThan(0);
    expect(light["--color-text-primary"]).toMatch(/^rgb\(/);
  });

  it("serializes each DTCG type explicitly", () => {
    expect(toCssValue("color", { colorSpace: "srgb", components: [1, 0.5, 0], alpha: 1 })).toBe("rgb(255 128 0)");
    expect(toCssValue("dimension", { value: 16, unit: "px" })).toBe("16px");
    expect(toCssValue("number", 1.5)).toBe("1.5");
    expect(toCssValue("fontFamily", ["Inter", "Helvetica Neue"])).toBe('Inter, "Helvetica Neue"');
    expect(toCssCustomPropertyName("font.lineHeight.normal")).toBe("--font-line-height-normal");
  });

  it("rejects a Theme name that does not select exactly one Theme", async () => {
    await expect(loadThemeTokens("no-such-theme")).rejects.toThrow(/does not select exactly one Theme/);
  });
});
