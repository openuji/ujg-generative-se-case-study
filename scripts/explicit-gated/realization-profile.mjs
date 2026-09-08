import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { realizationPhases } from "./phase-state.mjs";

export const realizationProfileRelativePath =
  "docs/skills/explicit-gated/ujg-to-design-system-realization/references/v1-stack.md";

const phases = new Set(realizationPhases);

function fail(message) {
  throw new Error(`Invalid realization profile: ${message}`);
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, expected, label) {
  if (!isObject(value)) fail(`${label} must be an object.`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    fail(`${label} must contain exactly: ${wanted.join(", ")}.`);
  }
}

function string(value, label) {
  if (typeof value !== "string" || value.length === 0) fail(`${label} must be a non-empty string.`);
}

function positiveInteger(value, label) {
  if (!Number.isInteger(value) || value < 1) fail(`${label} must be a positive integer.`);
}

function stringArray(value, label, { allowEmpty = false } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) fail(`${label} must be an array of strings.`);
  value.forEach((entry, index) => string(entry, `${label}[${index}]`));
  if (new Set(value).size !== value.length) fail(`${label} must not contain duplicates.`);
}

function version(value, label) {
  string(value, label);
  if (!/^\d+(?:\.\d+){0,2}$/.test(value)) fail(`${label} must be a numeric version.`);
}

function dependencyMap(value, label) {
  if (!isObject(value) || Object.keys(value).length === 0) fail(`${label} must contain dependencies.`);
  for (const [name, selectedVersion] of Object.entries(value)) {
    string(name, `${label} package name`);
    version(selectedVersion, `${label}.${name}`);
  }
}

function commandMap(value, label) {
  if (!isObject(value) || Object.keys(value).length === 0) fail(`${label} must contain commands.`);
  for (const [name, command] of Object.entries(value)) {
    string(name, `${label} command name`);
    exactKeys(command, ["executable", "args", "phases"], `${label}.${name}`);
    string(command.executable, `${label}.${name}.executable`);
    stringArray(command.args, `${label}.${name}.args`, { allowEmpty: true });
    stringArray(command.phases, `${label}.${name}.phases`, { allowEmpty: true });
    for (const phase of command.phases) {
      if (!phases.has(phase)) fail(`${label}.${name}.phases contains unsupported phase ${phase}.`);
    }
  }
}

function packageContract(value, label) {
  exactKeys(value, ["dependencies", "dev_dependencies"], label);
  dependencyMap(value.dependencies, `${label}.dependencies`);
  dependencyMap(value.dev_dependencies, `${label}.dev_dependencies`);
}

function requiredFileGroups(value, label) {
  if (!Array.isArray(value) || value.length === 0) fail(`${label} must contain file alternatives.`);
  value.forEach((group, index) => stringArray(group, `${label}[${index}]`));
  const serialized = value.map((group) => JSON.stringify(group));
  if (new Set(serialized).size !== serialized.length) fail(`${label} contains a duplicate group.`);
}

function targetContract(value, label, selectorKey) {
  const expected = [selectorKey, "package", "required_file_groups", "commands", "source_requirements"];
  if (selectorKey === "selector") expected.push("artifact_entry_files");
  exactKeys(value, expected, label);
  if (selectorKey === "selector") string(value.selector, `${label}.selector`);
  else stringArray(value.interface_kinds, `${label}.interface_kinds`);
  packageContract(value.package, `${label}.package`);
  requiredFileGroups(value.required_file_groups, `${label}.required_file_groups`);
  if (selectorKey === "selector") stringArray(value.artifact_entry_files, `${label}.artifact_entry_files`);
  const sourceKeys = selectorKey === "selector"
    ? [
        "artifact_forbidden_patterns",
        "test_required_patterns",
        "resolver_required_patterns",
        "css_required_patterns",
        "build_config_required_patterns",
        "inspection_required_patterns"
      ]
    : ["required_patterns"];
  exactKeys(value.source_requirements, sourceKeys, `${label}.source_requirements`);
  for (const key of sourceKeys) {
    stringArray(value.source_requirements[key], `${label}.source_requirements.${key}`);
    for (const pattern of value.source_requirements[key]) {
      try {
        new RegExp(pattern);
      } catch (error) {
        fail(`${label}.source_requirements.${key} contains invalid regex: ${error.message}`);
      }
    }
  }
  commandMap(value.commands, `${label}.commands`);
}

function validateProfile(profile) {
  exactKeys(profile, [
    "profile_version",
    "host",
    "package_manager",
    "target_profiles",
    "runtime_profiles",
    "workspace_commands",
    "themes",
    "prohibited"
  ], "root");
  positiveInteger(profile.profile_version, "profile_version");

  exactKeys(profile.host, ["node_version"], "host");
  version(profile.host.node_version, "host.node_version");

  exactKeys(profile.package_manager, ["name", "version", "lockfile", "workspace_file", "install_args"], "package_manager");
  string(profile.package_manager.name, "package_manager.name");
  version(profile.package_manager.version, "package_manager.version");
  string(profile.package_manager.lockfile, "package_manager.lockfile");
  string(profile.package_manager.workspace_file, "package_manager.workspace_file");
  stringArray(profile.package_manager.install_args, "package_manager.install_args");

  exactKeys(profile.target_profiles, ["design_system", "browser_interface"], "target_profiles");
  targetContract(profile.target_profiles.design_system, "target_profiles.design_system", "selector");
  targetContract(profile.target_profiles.browser_interface, "target_profiles.browser_interface", "interface_kinds");

  if (!isObject(profile.runtime_profiles) || Object.keys(profile.runtime_profiles).length === 0) {
    fail("runtime_profiles must contain at least one runtime.");
  }
  for (const [runtime, contract] of Object.entries(profile.runtime_profiles)) {
    string(runtime, "runtime profile name");
    exactKeys(contract, ["commands"], `runtime_profiles.${runtime}`);
    commandMap(contract.commands, `runtime_profiles.${runtime}.commands`);
  }
  commandMap(profile.workspace_commands, "workspace_commands");

  exactKeys(profile.themes, [
    "names",
    "shared_source_count",
    "unique_source_count_per_theme",
    "require_semantic_role_parity",
    "require_distinct_semantic_values",
    "required_semantic_roles",
    "light_evidence",
    "dark_evidence",
    "provenance_extension",
    "provenance_classification_field",
    "provenance_paths_field",
    "evidence_root"
  ], "themes");
  stringArray(profile.themes.names, "themes.names");
  if (profile.themes.names.length !== 2) fail("themes.names must contain the required pair.");
  positiveInteger(profile.themes.shared_source_count, "themes.shared_source_count");
  positiveInteger(profile.themes.unique_source_count_per_theme, "themes.unique_source_count_per_theme");
  if (typeof profile.themes.require_semantic_role_parity !== "boolean") fail("themes.require_semantic_role_parity must be boolean.");
  if (typeof profile.themes.require_distinct_semantic_values !== "boolean") fail("themes.require_distinct_semantic_values must be boolean.");
  stringArray(profile.themes.required_semantic_roles, "themes.required_semantic_roles");
  for (const key of [
    "light_evidence",
    "dark_evidence",
    "provenance_extension",
    "provenance_classification_field",
    "provenance_paths_field",
    "evidence_root"
  ]) string(profile.themes[key], `themes.${key}`);

  exactKeys(profile.prohibited, [
    "script_fragments",
    "implementation_file_fragments",
    "empty_build_fragments"
  ], "prohibited");
  stringArray(profile.prohibited.script_fragments, "prohibited.script_fragments");
  stringArray(profile.prohibited.implementation_file_fragments, "prohibited.implementation_file_fragments");
  stringArray(profile.prohibited.empty_build_fragments, "prohibited.empty_build_fragments");
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

export function loadRealizationProfile(repoRoot) {
  const profilePath = path.join(repoRoot, realizationProfileRelativePath);
  const source = fs.readFileSync(profilePath, "utf8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) fail(`${realizationProfileRelativePath} has no YAML frontmatter.`);
  let profile;
  try {
    profile = YAML.parse(match[1]);
  } catch (error) {
    fail(`frontmatter is not valid YAML: ${error.message}`);
  }
  validateProfile(profile);
  return deepFreeze(profile);
}

export function expandCommand(command, replacements = {}) {
  const replace = (value) => value.replace(/\{([a-z_]+)\}/g, (match, key) => {
    if (!Object.hasOwn(replacements, key)) fail(`command placeholder ${match} has no value.`);
    return replacements[key];
  });
  return {
    executable: replace(command.executable),
    args: command.args.map(replace)
  };
}
