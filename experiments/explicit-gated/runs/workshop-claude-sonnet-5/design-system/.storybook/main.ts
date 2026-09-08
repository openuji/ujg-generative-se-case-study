import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: {
    name: "@storybook/react-vite",
    options: {}
  },
  stories: [
    "../primitives/**/*.stories.tsx",
    "../components/**/*.stories.tsx",
    "../templates/**/*.stories.tsx",
    "../tokens/**/*.stories.tsx"
  ]
};

export default config;
