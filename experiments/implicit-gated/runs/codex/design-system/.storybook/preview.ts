import type { Preview } from "@storybook/react-vite";
import "../src/styles.css";

export const globalTypes = {
  theme: {
    name: "Theme",
    description: "Workshop interface theme",
    defaultValue: "light",
    toolbar: {
      icon: "circlehollow",
      items: ["light", "dark"],
      showName: true
    }
  }
};

const preview: Preview = {
  decorators: [
    (Story, context) => {
      document.documentElement.setAttribute("data-theme", context.globals.theme ?? "light");
      return Story();
    }
  ],
  parameters: {
    layout: "centered"
  }
};

export default preview;
