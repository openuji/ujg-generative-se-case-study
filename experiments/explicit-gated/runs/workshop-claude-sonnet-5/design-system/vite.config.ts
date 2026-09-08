import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
// @ts-expect-error - the styling adapter is plain ESM; the package carries no Node type definitions.
import { ujgThemeScopes } from "./tokens/themeCssPlugin.mjs";

export default defineConfig({
  // The Theme adapter runs before the styling tool so the generated Theme
  // scopes are already real CSS by the time Tailwind compiles the pipeline.
  plugins: [ujgThemeScopes(), react(), tailwindcss()],
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "design-system"
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"]
    }
  },
  test: {
    // Suites that need a browser-like environment keep the `.test.tsx` name.
    // Suites that only need this runner use `.vitest.*` so the workspace's own
    // plain-Node test command does not try to execute them without it.
    environment: "jsdom",
    include: [
      "primitives/**/*.test.tsx",
      "components/**/*.test.tsx",
      "templates/**/*.test.tsx",
      "tokens/**/*.test.ts",
      "tokens/**/*.test.tsx",
      "tokens/**/*.vitest.ts",
      "tokens/**/*.vitest.tsx",
      "tokens/**/*.vitest.mjs",
      "styles/**/*.vitest.mjs",
      "src/**/*.test.tsx"
    ]
  }
});
