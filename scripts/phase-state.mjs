import fs from "node:fs";
import path from "node:path";

export const realizationPhases = Object.freeze(["structure", "tokens", "styling", "application"]);
export const validationPhases = Object.freeze(["seed", ...realizationPhases, "complete"]);
export const realizationPhaseUsage = realizationPhases.join("|");
export const validationPhaseUsage = validationPhases.join("|");
export const phaseStateFile = ".ujg-realization-state.json";

function fail(message) {
  throw new Error(message);
}

function statePath(runRoot) {
  return path.join(runRoot, phaseStateFile);
}

function expectedNext(completed) {
  return realizationPhases[completed.length] ?? null;
}

function validateState(value, runName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("Realization phase state must be an object.");
  const keys = Object.keys(value).sort();
  if (JSON.stringify(keys) !== JSON.stringify(["active_phase", "completed_phases", "run_id", "schema_version"])) {
    fail("Realization phase state has unsupported fields.");
  }
  if (value.schema_version !== 1 || value.run_id !== runName) fail("Realization phase state has the wrong identity or version.");
  if (!Array.isArray(value.completed_phases)) fail("Realization completed_phases must be an array.");
  const prefix = realizationPhases.slice(0, value.completed_phases.length);
  if (JSON.stringify(value.completed_phases) !== JSON.stringify(prefix)) fail("Realization phases were not completed in order.");
  const next = expectedNext(value.completed_phases);
  if (value.active_phase !== null && value.active_phase !== next) fail("Realization active phase is not the next phase.");
  return value;
}

export function readPhaseState(runRoot, runName, { allowMissing = false } = {}) {
  const target = statePath(runRoot);
  if (!fs.existsSync(target)) {
    if (allowMissing) return null;
    fail("Run has no realization phase state; begin the structure phase first.");
  }
  try {
    return validateState(JSON.parse(fs.readFileSync(target, "utf8")), runName);
  } catch (error) {
    if (error instanceof SyntaxError) fail(`Realization phase state is not valid JSON: ${error.message}`);
    throw error;
  }
}

function writeState(runRoot, state) {
  const target = statePath(runRoot);
  const temporary = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, { flag: "wx" });
  fs.renameSync(temporary, target);
}

export function beginPhase({ runRoot, runName, phase }) {
  if (!realizationPhases.includes(phase)) fail(`Phase must be one of: ${realizationPhases.join(", ")}.`);
  const current = readPhaseState(runRoot, runName, { allowMissing: true }) ?? {
    schema_version: 1,
    run_id: runName,
    active_phase: null,
    completed_phases: []
  };
  if (current.active_phase === phase) return current;
  if (current.active_phase !== null) fail(`Phase ${current.active_phase} is still active.`);
  const next = expectedNext(current.completed_phases);
  if (next === null) fail("All generation phases are already complete.");
  if (phase !== next) fail(`Next permitted phase is ${next}, not ${phase}.`);
  const updated = { ...current, active_phase: phase };
  writeState(runRoot, updated);
  return updated;
}

export function requireActivePhase({ runRoot, runName, phase }) {
  const state = readPhaseState(runRoot, runName);
  if (state.active_phase !== phase) {
    const next = state.active_phase ?? expectedNext(state.completed_phases) ?? "evaluation";
    fail(`Phase ${phase} is not active; current workflow phase is ${next}.`);
  }
  return state;
}

export function completePhase({ runRoot, runName, phase }) {
  const state = requireActivePhase({ runRoot, runName, phase });
  const updated = {
    ...state,
    active_phase: null,
    completed_phases: [...state.completed_phases, phase]
  };
  writeState(runRoot, updated);
  return updated;
}

export function requireGenerationComplete({ runRoot, runName }) {
  const state = readPhaseState(runRoot, runName);
  if (state.active_phase !== null || JSON.stringify(state.completed_phases) !== JSON.stringify(realizationPhases)) {
    fail("All four generation phases must pass executable verification before evaluation or completion.");
  }
  return state;
}
