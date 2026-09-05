import React, { type CSSProperties } from "react";
import type { Preview } from "@storybook/react-vite";

import { getThemes, themeCssProperties, themeIdFromGlobal, themeSlug } from "../tokens/token-system";

const themes = getThemes();
const defaultTheme = themes[0]?.id ?? "";
const defaultThemeSelection = themeSlug(defaultTheme);

const preview: Preview = {
  globalTypes: {
    ujgTheme: {
      name: "UJG Theme",
      defaultValue: defaultThemeSelection,
      toolbar: {
        icon: "paintbrush",
        items: themes.map((theme) => ({
          value: themeSlug(theme.id),
          title: themeSlug(theme.id)
        })),
        dynamicTitle: true
      }
    }
  },
  decorators: [
    (Story, context) => {
      const themeId = themeIdFromGlobal(context.globals.ujgTheme ?? defaultTheme);
      const style = {
        ...themeCssProperties(themeId),
        minHeight: "100%"
      } as CSSProperties;

      return React.createElement(
        "div",
        {
          "data-ujg-theme": themeSlug(themeId),
          style
        },
        React.createElement(Story)
      );
    }
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  }
};

export default preview;
