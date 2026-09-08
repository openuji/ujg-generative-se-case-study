import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GroupPage, OverviewPage, ThemeComparisonPage } from "./TokenGallery";
import { resolveTheme, semanticTokens, themeKeys, themes } from "./themeTokens";

afterEach(cleanup);

describe("token inspection pages", () => {
  it("renders the overview for every Theme with that Theme's own token sources", () => {
    for (const theme of themes) {
      render(<OverviewPage themeKey={theme.key} />);
      expect(screen.getByText("Token overview")).toBeDefined();
      expect(screen.getAllByText(theme.label).length).toBeGreaterThan(0);
      for (const source of theme.sources) {
        expect(screen.getAllByText(new RegExp(source.source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))).length)
          .toBeGreaterThan(0);
      }
      cleanup();
    }
  });

  it("renders a foundation group page from resolved values", () => {
    render(
      <GroupPage
        themeKey={themeKeys[0]}
        layer="foundation"
        group="radius"
        title="Foundation · corner radii"
        description="Corner radii read off the reference geometry."
      />
    );
    expect(screen.getByText("radius.full")).toBeDefined();
    expect(screen.getAllByText("999px").length).toBeGreaterThan(0);
  });

  it("renders a semantic group page with its alias chain and provenance", () => {
    render(
      <GroupPage
        themeKey={themeKeys[0]}
        layer="semantic"
        group="color.focus"
        title="Semantic · focus"
        description="Focus indicator colour."
      />
    );
    expect(screen.getByText("color.focus.ring")).toBeDefined();
    expect(screen.getAllByText(/^rgb\(/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/direct/).length).toBeGreaterThan(0);
  });

  it("compares semantic roles across every Theme", () => {
    render(<ThemeComparisonPage />);
    for (const theme of themes) {
      expect(screen.getByText(theme.label.toUpperCase())).toBeDefined();
    }
    for (const token of semanticTokens(resolveTheme(themeKeys[0]))) {
      expect(screen.getByText(token.path)).toBeDefined();
    }
  });
});
