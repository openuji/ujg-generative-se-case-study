import type { Plugin } from "vite";
import { buildDesignTokensCss, buildDesignTokensManifest } from "./resolve-tokens.ts";

const CSS_VIRTUAL_ID = "virtual-design-tokens.css";
const MANIFEST_VIRTUAL_ID = "virtual-design-tokens-manifest";

export function designTokensPlugin(): Plugin {
  return {
    name: "ujg-design-tokens",
    resolveId(id) {
      if (id === CSS_VIRTUAL_ID || id === MANIFEST_VIRTUAL_ID) return id;
      return undefined;
    },
    load(id) {
      if (id === CSS_VIRTUAL_ID) return buildDesignTokensCss();
      if (id === MANIFEST_VIRTUAL_ID) return `export default ${JSON.stringify(buildDesignTokensManifest())};`;
      return undefined;
    }
  };
}
