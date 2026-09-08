import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import { designTokensPlugin } from "../src/tokens/vite-plugin-design-tokens.ts";

const config: StorybookConfig = {
  stories: [
    "../components/**/*.stories.@(ts|tsx)",
    "../templates/**/*.stories.@(ts|tsx)",
    "../primitives/**/*.stories.@(ts|tsx)",
    "../src/stories/**/*.stories.@(ts|tsx)"
  ],
  addons: [],
  framework: {
    name: "@storybook/react-vite",
    options: {}
  },
  async viteFinal(viteConfig) {
    return mergeConfig(viteConfig, { plugins: [designTokensPlugin()] });
  }
};

export default config;
