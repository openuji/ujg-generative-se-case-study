import type { Preview } from "@storybook/react-vite";
import { createElement } from "react";
import { defaultThemeName, ThemeStyleProvider, themeOptions } from "../src/theme";
import "../src/global.css";

export const globalTypes = {
  theme: {
    description: "Theme",
    toolbar: {
      title: "Theme",
      icon: "circlehollow",
      items: themeOptions.map((theme) => ({
        value: theme.name,
        title: theme.label
      })),
      dynamicTitle: true
    }
  }
};

const preview: Preview = {
  initialGlobals: {
    theme: defaultThemeName
  },
  decorators: [
    (Story, context) => {
      const selected = typeof context.globals.theme === "string" ? context.globals.theme : defaultThemeName;
      if (typeof document !== "undefined") document.documentElement.setAttribute("data-theme", selected);
      return createElement(ThemeStyleProvider, { themeName: selected }, createElement(Story));
    }
  ],
  parameters: {
    controls: {
      expanded: true
    }
  }
};

export default preview;
