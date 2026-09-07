# Application realization evaluation

Evaluate all manifest-selected application targets in one clean-room realization
run. This rubric is evaluation-only and contains no assumptions about interface
kinds, protocols, delivery mechanisms, adapters, runtimes, or target paths.

## Inputs and mutation boundary

The caller supplies the repository root, run name, implementation-model label,
evaluator-model label, and requested result path. Treat a missing model label as
JSON `null`. Read only:

- `experiments/full-application-generation/runs/<run-name>/`;
- its immutable UJG and referenced schemas;
- its `ujg-implementation.yaml`;
- every target and design system selected by that manifest; and
- already-existing test, build, documentation, and render artifacts in the run.

The evaluated UJG is the token-enriched run-local document. Its generated
Theme/TokenSource nodes are authoritative inputs at this phase, not application
outputs.

Derive expected coverage exclusively from the evaluated run's manifest. Iterate
`interfaces` generically and interpret each entry's `touchpoint_ref`, `kind`,
`target`, `transport`, `delivery`, `interaction_state_owner`, and
`design_systems` exactly as declared. Interpret domain runtime, adapters,
bootstrap, and documentation requirements only when declared.

Do not inspect the root reference implementation or another run. Do not execute
builds, tests, servers, validators, package managers, or application code. Do not
modify implementation files. The only permitted write is the requested result
JSON. Refuse to overwrite it.

Normalize the evaluator filename label by lowercasing it, replacing each run of
non-ASCII-alphanumeric characters with `-`, and stripping leading/trailing `-`.
The canonical path is
`checks/evaluation/<run-name>/application.<evaluator>.json`.

## Scoring

Score exactly these six metrics from 0 to 5. Use static absence as evidence; do
not use `null` for a score. Use `null` for an unmeasurable supporting count.

1. `manifest_realization_coverage`: all and only selected targets, runtimes,
   interfaces, ownership choices, transports/delivery mechanisms, adapters,
   bootstrap, and requested documentation are realized.
2. `ujg_behavioral_fidelity`: entries, states, transitions, commands, conditional
   branches, exits, continuations, Touchpoint boundaries, data contracts, and
   direct-entry/materialization behavior preserve the complete UJG.
3. `domain_integrity`: authoritative conditions, effects, invariants,
   authorization, atomic re-evaluation, idempotency, concurrency, and
   subject/resource binding live at the manifest-selected state-changing
   boundary and cover every modeled outcome.
4. `interface_design_system_integration`: each manifest interface honors its
   state owner and declared boundary mechanisms, and every UJG visual realization
   uses the selected design-system binding without bypassing Slot composition.
5. `source_of_truth_integrity`: the UJG remains the sole semantic authority; the
   manifest selects architecture without restating behavior; no generated
   clients/types, transition or screen maps, realization dictionaries, trace
   matrices, parallel schemas, or leaked UJG identifiers exist. The only mapping
   is each selected design system's Component/Template bindings manifest.
6. `verification_coverage`: maintained static tests/evidence cover every branch,
   effect/no-effect outcome, invariant, invalid mutation, repeated/competing
   command, authority rule, continuation, data shape, and selected boundary;
   existing check artifacts establish the requested builds/typechecks/docs.

Calculate `quality_score_5` as the arithmetic mean of all six scores, rounded to
at most four decimal places. `quality_score_100` is that value multiplied by 20,
rounded to at most two decimal places.

Classify complexity separately as `minimal`, `moderate`, or `heavy`. Consider
maintained source, boundary infrastructure, dependencies, and abstraction burden;
do not reward fewer lines automatically. Complexity never changes quality.

Report at most five material findings using `HIGH`, `MEDIUM`, or `LOW`, with
each JSON finding represented by `severity`, `summary`, and a non-empty
`evidence` array of repository-relative file locations. Never penalize a run for
technology or an interface not selected by its manifest.

## Required result

Return a short human-readable summary, then end with exactly one fenced JSON
object matching this shape. Write that object alone to the requested result path.

```json
{
  "evaluation_version": "application-realization-core-v1",
  "run_id": null,
  "evaluated_phase": "application",
  "implementation_model": null,
  "evaluator_model": null,
  "quality_score_5": null,
  "quality_score_100": null,
  "scores": {
    "manifest_realization_coverage": null,
    "ujg_behavioral_fidelity": null,
    "domain_integrity": null,
    "interface_design_system_integration": null,
    "source_of_truth_integrity": null,
    "verification_coverage": null
  },
  "complexity": {
    "classification": null,
    "implementation_file_count": null,
    "infrastructure_loc": null,
    "new_dependency_count": null
  },
  "metrics": {
    "manifest_interface_count": null,
    "realized_interface_count": null,
    "selected_target_count": null,
    "missing_target_count": null,
    "modeled_branch_count": null,
    "verified_branch_count": null,
    "effect_invariant_violation_count": null,
    "design_system_integration_violation_count": null,
    "prohibited_projection_count": null,
    "identifier_leak_count": null,
    "verification_coverage_ratio": null
  },
  "findings": []
}
```

Keep the version, metric definitions, names, and arithmetic unchanged across
evaluated implementations.
