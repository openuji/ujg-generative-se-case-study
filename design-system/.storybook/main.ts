import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: {
    name: "@storybook/react-vite",
    options: {}
  },
  stories: [
    "../components/**/*.stories.tsx",
    "../primitives/**/*.stories.tsx",
    "../tokens/**/*.stories.tsx",
    "../templates/**/*.stories.tsx"
  ]
};

export default config;
