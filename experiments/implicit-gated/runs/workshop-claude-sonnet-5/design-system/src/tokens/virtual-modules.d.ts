declare module "virtual-design-tokens.css";

declare module "virtual-design-tokens-manifest" {
  import type { DesignTokensManifest } from "./resolve-tokens";
  const manifest: DesignTokensManifest;
  export default manifest;
}
