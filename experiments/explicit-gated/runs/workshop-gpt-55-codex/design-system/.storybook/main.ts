import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    "../components/**/*.stories.@(ts|tsx)",
    "../templates/**/*.stories.@(ts|tsx)",
    "../Tokens/**/*.stories.@(ts|tsx)"
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {}
  }
};

export default config;
