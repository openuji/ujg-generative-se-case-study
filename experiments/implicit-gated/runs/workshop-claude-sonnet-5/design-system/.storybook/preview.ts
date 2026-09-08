import type { Preview } from "@storybook/react-vite";
import "../src/styles/global.css";
import "virtual-design-tokens.css";

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Theme applied to the active Theme scope",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" }
        ],
        dynamicTitle: true
      }
    }
  },
  initialGlobals: {
    theme: "light"
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme ?? "light";
      document.documentElement.setAttribute("data-theme", theme);
      return Story();
    }
  ],
  parameters: {
    backgrounds: { disable: true }
  }
};

export default preview;
