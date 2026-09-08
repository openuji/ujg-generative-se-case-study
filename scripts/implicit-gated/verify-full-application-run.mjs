#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { normalizeForwardedArgs } from "./cli-args.mjs";
import { validateFullApplicationRun } from "./full-application-run-utils.mjs";
import { expandCommand, loadRealizationProfile } from "./realization-profile.mjs";

function fail(message) {
  throw new Error(message);
}

function unique(values) {
  return [...new Set(values)];
}

function defaultRunner({ executable, args, cwd, expectedOutput }) {
  const result = spawnSync(executable, args, expectedOutput
    ? { cwd, encoding: "utf8" }
    : { cwd, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) fail(`${executable} ${args.join(" ")} failed in ${cwd}.`);
  if (expectedOutput && result.stdout.trim() !== expectedOutput) {
    fail(`${executable} version does not match the realization profile.`);
  }
}

function commandTasks(commands, phase, cwd, profile, replacements = {}) {
  return Object.entries(commands)
    .filter(([, command]) => command.phases.includes(phase))
    .map(([name, command]) => {
      const expanded = expandCommand(command, replacements);
      if (expanded.executable === profile.package_manager.name) {
        return { name, cwd, executable: expanded.executable, args: expanded.args };
      }
      return {
        name,
        cwd,
        executable: profile.package_manager.name,
        args: ["--dir", cwd, "exec", expanded.executable, ...expanded.args]
      };
    });
}

export function buildVerificationTasks({ runRoot, manifest, profile, phase, temporaryOutput }) {
  const tasks = [{
    name: "package-manager-version",
    cwd: runRoot,
    executable: profile.package_manager.name,
    args: ["--version"],
    expectedOutput: profile.package_manager.version
  }, {
    name: "install",
    cwd: runRoot,
    executable: profile.package_manager.name,
    args: profile.package_manager.install_args
  }];
  const replacements = { temporary_output: temporaryOutput };
  const designSystems = unique((manifest.interfaces ?? []).flatMap((entry) =>
    Array.isArray(entry.design_systems) ? entry.design_systems : []
  ));
  for (const selected of designSystems) {
    const targetOutput = path.join(temporaryOutput, selected.replace(/[^a-z0-9]+/gi, "-"));
    tasks.push(...commandTasks(
      profile.target_profiles.design_system.commands,
      phase,
      path.resolve(runRoot, selected),
      profile,
      { ...replacements, temporary_output: targetOutput }
    ));
  }

  if (phase === "application") {
    const browserKinds = new Set(profile.target_profiles.browser_interface.interface_kinds);
    for (const [index, entry] of (manifest.interfaces ?? []).entries()) {
      if (entry.target === undefined) continue;
      if (!browserKinds.has(entry.kind)) fail(`No executable verifier profile supports interfaces[${index}].kind ${entry.kind}.`);
      tasks.push(...commandTasks(
        profile.target_profiles.browser_interface.commands,
        phase,
        path.resolve(runRoot, entry.target),
        profile,
        replacements
      ));
    }

    if (manifest.domain_engine) {
      const runtime = manifest.domain_engine.runtime?.environment;
      const runtimeProfile = profile.runtime_profiles[runtime];
      if (!runtimeProfile) fail(`No executable verifier profile supports domain runtime ${runtime}.`);
      const domainRoot = path.resolve(runRoot, manifest.domain_engine.target);
      tasks.push(...Object.entries(runtimeProfile.commands)
        .filter(([, command]) => command.phases.includes(phase))
        .map(([name, command]) => ({
          name,
          cwd: domainRoot,
          ...expandCommand(command, {
            entrypoint: path.resolve(domainRoot, manifest.domain_engine.runtime.entrypoint)
          })
        })));
    }
    tasks.push(...Object.entries(profile.workspace_commands)
      .filter(([, command]) => command.phases.includes(phase))
      .map(([name, command]) => ({ name, cwd: runRoot, ...expandCommand(command, replacements) })));
  }
  return tasks;
}

export function verifyFullApplicationRun({ repoRoot, runsRoot, runName, phase, runner = defaultRunner, hostVersion = process.versions.node }) {
  if (!new Set(["structure", "tokens", "styling", "application"]).has(phase)) {
    fail("Verification phase must be structure, tokens, styling, or application.");
  }
  if (hostVersion.split(".")[0] !== loadRealizationProfile(repoRoot).host.node_version) {
    fail("Host Node version does not match the realization profile.");
  }
  validateFullApplicationRun({
    repoRoot,
    runsRoot,
    runName,
    phase: phase === "application" ? "complete" : phase,
    requireEvaluations: false
  });
  const runRoot = path.join(runsRoot, runName);
  const manifest = YAML.parse(fs.readFileSync(path.join(runRoot, "ujg-implementation.yaml"), "utf8"));
  const profile = loadRealizationProfile(repoRoot);
  const temporaryOutput = fs.mkdtempSync(path.join(os.tmpdir(), "ujg-storybook-verify-"));
  try {
    const tasks = buildVerificationTasks({ runRoot, manifest, profile, phase, temporaryOutput });
    for (const task of tasks) runner(task);
  } finally {
    fs.rmSync(temporaryOutput, { recursive: true, force: true });
  }
  return runRoot;
}

const isEntrypoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const runsRoot = path.join(repoRoot, "experiments", "implicit-gated", "runs");
  const args = normalizeForwardedArgs(process.argv.slice(2));
  let runName;
  let phase;
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--phase") {
      phase = args[index + 1];
      index += 1;
    } else if (!args[index].startsWith("--") && runName === undefined) {
      runName = args[index];
    } else {
      fail("Usage: pnpm verify:full-application-run -- <run-name> --phase <structure|tokens|styling|application>");
    }
  }
  if (!runName || !phase) fail("Usage: pnpm verify:full-application-run -- <run-name> --phase <structure|tokens|styling|application>");
  try {
    verifyFullApplicationRun({ repoRoot, runsRoot, runName, phase });
    console.log(`Verified ${phase} phase for ${runName}.`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
