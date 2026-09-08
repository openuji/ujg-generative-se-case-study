import { createElement } from "react";
import type { Decorator, Preview } from "@storybook/react";
import { defaultThemeKey, themes } from "../tokens/themeTokens";
import "../styles/global.css";
import "virtual:ujg-theme-scopes.css";
import "../styles/inspection.css";

/**
 * The Theme selector is built from the UJG Theme nodes the run declares, so
 * adding or renaming a Theme in the graph changes the toolbar without any
 * edit here. The selected Theme is published as `data-theme`, which is the
 * hook the styling adapter binds its resolved custom properties to.
 *
 * The inspection surface loads the same styling entry and the same generated
 * Theme scopes as the built package, so nothing on a story is styled by a
 * mechanism production does not have.
 */
const withTheme: Decorator = (Story, context) =>
  createElement(
    "div",
    { "data-theme": String(context.globals.theme ?? defaultThemeKey), className: "ujg-theme-frame" },
    createElement(Story)
  );

/** Explicit mobile and desktop framing for responsive artifacts. */
export const inspectionViewports = {
  mobile: {
    name: "Mobile",
    styles: { width: "390px", height: "844px" },
    type: "mobile" as const
  },
  desktop: {
    name: "Desktop",
    styles: { width: "1280px", height: "900px" },
    type: "desktop" as const
  }
};

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        date: /(date|expiresAt)$/i
      }
    },
    viewport: {
      options: inspectionViewports
    }
  },
  globalTypes: {
    theme: {
      description: "UJG Theme used to resolve token values",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        dynamicTitle: true,
        items: themes.map((theme) => ({ value: theme.key, title: theme.label }))
      }
    }
  },
  initialGlobals: {
    theme: defaultThemeKey
  },
  decorators: [withTheme]
};

export default preview;
