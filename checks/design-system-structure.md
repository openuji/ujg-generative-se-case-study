# Design-system structure evaluation

Evaluate the design-system structure phase of one clean-room realization run.
This rubric is evaluation-only and deliberately independent from generation.

Read the canonical realization requirements from
`docs/skills/<guidance>/ujg-to-design-system-realization/references/v1-stack.md`. Do not
restate or infer a separate stack contract.

## Inputs and mutation boundary

The caller supplies the repository root, guidance mode, run name,
implementation-model label, evaluator-model label, and requested result path.
Treat a missing model label as JSON `null`. Read only:

- `experiments/<guidance>/runs/<run-name>/`;
- that run's UJG, referenced schemas, manifest-selected design systems, source,
  stories, and already-existing test/build/render artifacts; and
- shared appearance references only when needed to distinguish structure from
  screenshot-invented content.

Do not inspect the root reference implementation or another run. Do not execute
builds, tests, servers, validators, package managers, or application code. Do not
modify implementation files. The only permitted write is the requested result
JSON. Refuse to overwrite it.

At this phase the run-local UJG must still be token-unrealized: `Theme` and
`TokenSource` nodes are absent. Their absence is intentional and does not reduce
artifact coverage or inspectability.

Normalize the evaluator filename label by lowercasing it, replacing each run of
non-ASCII-alphanumeric characters with `-`, and stripping leading/trailing `-`.
Reject an empty result. The canonical result path is
`checks/evaluation/<guidance>/<run-name>/structure.<evaluator>.json`.

## Scoring

Score exactly these six metrics from 0 to 5. Use static absence as evidence; do
not use `null` for a score. Use `null` for an unmeasurable supporting count.

1. `artifact_coverage`: one maintained profile-conformant implementation and one colocated
   story for every UJG Component and Template; primitives remain separate;
   bindings cover exactly those artifacts.
2. `composition_fidelity`: Templates expose modeled Slots, SlotBindings and
   SurfaceRealizations are preserved, target-Surface boundaries are respected,
   repeated instances do not become extra modeled artifacts, and Commands do not
   become branch-specific controls.
3. `data_contract_fidelity`: data-bound props and editable form keys follow the
   referenced JSON Schemas exactly, without a second schema, field dictionary, or
   generated type source.
4. `identity_containment`: UJG identifiers occur only in the immutable UJG,
   referenced schema identity fields, and
   `design-system/generated/ds-bindings.manifest.json`; bindings contain only
   Component/Template entries with `ujgRef`, `type`, `module`, and `export`.
5. `implementation_modularity`: Components, Templates, and domain-neutral
   primitives have coherent responsibilities; structural source contains no
   application flow, domain behavior, transport, or premature visual system.
6. `storybook_inspectability`: every artifact is independently inspectable;
   Template stories demonstrate modeled composition; data-bound forms have
   static evidence of an interaction story that serializes exact schema keys.

Calculate `quality_score_5` as the arithmetic mean of all six scores. Round to at
most four decimal places. `quality_score_100` is that value multiplied by 20,
rounded to at most two decimal places.

Classify complexity separately as `minimal`, `moderate`, or `heavy` from file
count, structural infrastructure, dependency surface, and abstraction burden.
Complexity never changes quality.

Report at most five material findings. Use `HIGH`, `MEDIUM`, or `LOW`; each
finding is an object with `severity`, `summary`, and a non-empty `evidence` array
of repository-relative file locations. Do not include style nits.

## Required result

Return a short human-readable summary, then end with exactly one fenced JSON
object matching this shape. Write that object alone to the requested result path.

```json
{
  "evaluation_version": "ds-structure-core-v1",
  "run_id": null,
  "evaluated_phase": "structure",
  "implementation_model": null,
  "evaluator_model": null,
  "quality_score_5": null,
  "quality_score_100": null,
  "scores": {
    "artifact_coverage": null,
    "composition_fidelity": null,
    "data_contract_fidelity": null,
    "identity_containment": null,
    "implementation_modularity": null,
    "storybook_inspectability": null
  },
  "complexity": {
    "classification": null,
    "implementation_file_count": null,
    "infrastructure_loc": null,
    "new_dependency_count": null
  },
  "metrics": {
    "expected_component_count": null,
    "implemented_component_count": null,
    "expected_template_count": null,
    "implemented_template_count": null,
    "missing_story_count": null,
    "binding_mismatch_count": null,
    "composition_violation_count": null,
    "data_contract_violation_count": null,
    "identifier_leak_count": null,
    "interaction_story_coverage_ratio": null
  },
  "findings": []
}
```

Keep the version, metric definitions, names, and arithmetic unchanged across
evaluated implementations.
