---
profile_version: 1
host:
  node_version: "22"
package_manager:
  name: pnpm
  version: 10.14.0
  lockfile: pnpm-lock.yaml
  workspace_file: pnpm-workspace.yaml
  install_args: [install, --frozen-lockfile]
target_profiles:
  design_system:
    selector: manifest-design-systems
    package:
      dependencies:
        react: 19.2.8
        react-dom: 19.2.8
      dev_dependencies:
        "@storybook/react": 10.5.10
        "@storybook/react-vite": 10.5.10
        "@tailwindcss/vite": 4.3.3
        "@testing-library/dom": 10.4.1
        "@testing-library/react": 16.3.2
        "@types/react": 19.2.18
        "@types/react-dom": 19.2.5
        "@vitejs/plugin-react": 6.1.1
        jsdom: 27.0.0
        storybook: 10.5.10
        tailwindcss: 4.3.3
        typescript: 7.0.2
        vite: 8.2.2
        vitest: 4.1.0
    required_file_groups:
      - [tsconfig.json]
      - [vite.config.ts, vite.config.mts, vite.config.js, vite.config.mjs]
      - [.storybook/main.ts, .storybook/main.js, .storybook/main.mjs]
      - [.storybook/preview.ts, .storybook/preview.js, .storybook/preview.mjs]
    artifact_entry_files: [src/index.ts, src/index.tsx]
    source_requirements:
      artifact_forbidden_patterns: ["return\\s+null"]
      test_required_patterns: ["render\\s*\\(", "expect\\s*\\("]
      resolver_required_patterns: ["JSON\\.parse", tokenSourceRefs, "readFile", "\\.source"]
      css_required_patterns: ["@import\\s+['\"]tailwindcss['\"]", "var\\(--"]
      build_config_required_patterns: ["@tailwindcss/vite", "tailwindcss\\s*\\("]
      inspection_required_patterns: [globalTypes, data-theme]
    commands:
      typecheck:
        executable: tsc
        args: [--noEmit, -p, tsconfig.json]
        phases: [structure, tokens, styling, application]
      test:
        executable: vitest
        args: [run]
        phases: [structure, tokens, styling, application]
      build:
        executable: vite
        args: [build]
        phases: [structure, tokens, styling, application]
      storybook:
        executable: storybook
        args: [dev]
        phases: []
      build-storybook:
        executable: storybook
        args: [build, --config-dir, .storybook, --output-dir, "{temporary_output}"]
        phases: [structure, tokens, styling, application]
  browser_interface:
    interface_kinds: [browser]
    package:
      dependencies:
        react: 19.2.8
        react-dom: 19.2.8
      dev_dependencies:
        "@vitejs/plugin-react": 6.1.1
        typescript: 7.0.2
        vite: 8.2.2
    required_file_groups:
      - [tsconfig.json]
      - [vite.config.ts, vite.config.mts, vite.config.js, vite.config.mjs]
      - [src/main.tsx, src/main.jsx]
    source_requirements:
      required_patterns: ["createRoot|hydrateRoot"]
    commands:
      typecheck:
        executable: tsc
        args: [--noEmit, -p, tsconfig.json]
        phases: [application]
      build:
        executable: vite
        args: [build]
        phases: [application]
runtime_profiles:
  node:
    commands:
      syntax:
        executable: node
        args: [--check, "{entrypoint}"]
        phases: [application]
workspace_commands:
  test:
    executable: node
    args: [--test]
    phases: [application]
themes:
  names: [light, dark]
  shared_source_count: 1
  unique_source_count_per_theme: 1
  require_semantic_role_parity: true
  require_distinct_semantic_values: true
  required_semantic_roles: [surface, text, border, action, control, focus, success, warning, error]
  light_evidence: direct
  dark_evidence: inferred
  provenance_extension: org.openuji.visual-evidence
  provenance_classification_field: confidence
  provenance_paths_field: screenPaths
  evidence_root: references/workshop-registration/screens
prohibited:
  script_fragments: [placeholder, inventory-only, inventory checked]
  implementation_file_fragments: [storybook-placeholder]
  empty_build_fragments: ["export {};", "export{};"]
---

# Design-system realization profile v1

The frontmatter is the sole machine-readable and human-readable authority for
this realization profile. Realization skills, validators, verifiers, rubrics,
and tests must load it rather than restating its values.

The profile applies its design-system target contract to paths selected through
the realization manifest. An interface target receives an additional profile
only when its manifest-declared kind matches that profile. Runtime verification
is likewise dispatched from the manifest rather than assumed.

Theme identities are generated in the run-local UJG. The shared and per-theme
source topology, evidence treatment, and required semantic coverage come from
the frontmatter. This profile is implementation policy, not UJG semantics or a
UJG-to-code mapping.
