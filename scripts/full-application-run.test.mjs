import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  seedFullApplicationRun,
  validateFullApplicationRun
} from "./full-application-run-utils.mjs";

const canonicalRepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function prepareFixture(t) {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ujg-full-run-"));
  t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));

  const repoRoot = path.join(fixtureRoot, "repo");
  const runsRoot = path.join(repoRoot, "experiments", "full-application-generation", "runs");
  fs.mkdirSync(path.join(repoRoot, "ujg"), { recursive: true });
  fs.copyFileSync(
    path.join(canonicalRepoRoot, "ujg", "workshop-registration.ujg.jsonld"),
    path.join(repoRoot, "ujg", "workshop-registration.ujg.jsonld")
  );
  fs.cpSync(path.join(canonicalRepoRoot, "ujg", "schemas"), path.join(repoRoot, "ujg", "schemas"), {
    recursive: true
  });
  fs.copyFileSync(
    path.join(canonicalRepoRoot, "ujg-implementation.yaml"),
    path.join(repoRoot, "ujg-implementation.yaml")
  );
  fs.mkdirSync(runsRoot, { recursive: true });
  return { repoRoot, runsRoot };
}

function relativeFiles(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(root, entry.name);
    return entry.isDirectory()
      ? relativeFiles(entryPath).map((child) => path.join(entry.name, child))
      : [entry.name];
  }).sort();
}

test("seeds a token-unrealized UJG plus byte-identical contracts and validates the seed", (t) => {
  const { repoRoot, runsRoot } = prepareFixture(t);
  const runRoot = seedFullApplicationRun({ repoRoot, runsRoot, runName: "model-a" });

  assert.deepEqual(fs.readdirSync(runRoot).sort(), ["ujg", "ujg-implementation.yaml"]);
  assert.deepEqual(relativeFiles(runRoot), [
    "ujg-implementation.yaml",
    "ujg/schemas/offer-summary-data.schema.json",
    "ujg/schemas/registration-form-data.schema.json",
    "ujg/schemas/registration-review-data.schema.json",
    "ujg/schemas/status-message-data.schema.json",
    "ujg/schemas/status-notice-data.schema.json",
    "ujg/schemas/waitlist-form-data.schema.json",
    "ujg/schemas/waitlist-review-data.schema.json",
    "ujg/schemas/workshop-detail-data.schema.json",
    "ujg/schemas/workshop-teaser-data.schema.json",
    "ujg/workshop-registration.ujg.jsonld"
  ]);
  assert.ok(fs.readFileSync(path.join(runRoot, "ujg-implementation.yaml")).equals(
    fs.readFileSync(path.join(repoRoot, "ujg-implementation.yaml"))
  ));
  assert.ok(fs.readFileSync(path.join(runRoot, "ujg", "workshop-registration.ujg.jsonld")).equals(
    fs.readFileSync(path.join(repoRoot, "ujg", "workshop-registration.ujg.jsonld"))
  ));
  const runUjg = JSON.parse(fs.readFileSync(path.join(runRoot, "ujg", "workshop-registration.ujg.jsonld"), "utf8"));
  assert.equal(runUjg.nodes.some((node) => node["@type"] === "Theme"), false);
  assert.equal(runUjg.nodes.some((node) => node["@type"] === "TokenSource"), false);
  assert.equal(
    validateFullApplicationRun({ repoRoot, runsRoot, runName: "model-a", phase: "seed" }),
    runRoot
  );

  for (const forbidden of ["apps", "design-system", "design", "tests", "scripts", "package.json"]) {
    assert.equal(fs.existsSync(path.join(runRoot, forbidden)), false, `${forbidden} must not be seeded`);
  }
});

test("rejects unsafe run names without creating a target", (t) => {
  const { repoRoot, runsRoot } = prepareFixture(t);
  for (const runName of ["../escape", "Uppercase", "two words", "-leading", "trailing-"]) {
    assert.throws(
      () => seedFullApplicationRun({ repoRoot, runsRoot, runName }),
      /Run name must be/
    );
  }
  assert.deepEqual(fs.readdirSync(runsRoot), []);
});

test("refuses to overwrite an existing run", (t) => {
  const { repoRoot, runsRoot } = prepareFixture(t);
  const runRoot = seedFullApplicationRun({ repoRoot, runsRoot, runName: "repeat" });
  const marker = path.join(runRoot, "marker.txt");
  fs.writeFileSync(marker, "preserve me");

  assert.throws(
    () => seedFullApplicationRun({ repoRoot, runsRoot, runName: "repeat" }),
    /Run already exists/
  );
  assert.equal(fs.readFileSync(marker, "utf8"), "preserve me");
});

test("validates a synthetic completed run and rejects prohibited projections or identifier leaks", (t) => {
  const { repoRoot, runsRoot } = prepareFixture(t);
  const runRoot = seedFullApplicationRun({ repoRoot, runsRoot, runName: "completed" });
  const ujg = JSON.parse(fs.readFileSync(path.join(runRoot, "ujg", "workshop-registration.ujg.jsonld"), "utf8"));
  ujg.nodes.push(
    {
      "@type": "TokenSource",
      "@id": "urn:ujg:token-source:fixture-foundation",
      label: "Fixture foundation",
      source: "../design/tokens/fixture-foundation.tokens.json"
    },
    {
      "@type": "TokenSource",
      "@id": "urn:ujg:token-source:fixture-default",
      label: "Fixture default semantics",
      source: "../design/tokens/fixture-default.tokens.json"
    },
    {
      "@type": "Theme",
      "@id": "urn:ujg:theme:fixture-default",
      label: "Fixture default",
      tokenSourceRefs: [
        "urn:ujg:token-source:fixture-foundation",
        "urn:ujg:token-source:fixture-default"
      ]
    }
  );
  fs.writeFileSync(
    path.join(runRoot, "ujg", "workshop-registration.ujg.jsonld"),
    `${JSON.stringify(ujg, null, 2)}\n`
  );
  const enrichedUjgSource = fs.readFileSync(
    path.join(runRoot, "ujg", "workshop-registration.ujg.jsonld"),
    "utf8"
  );

  fs.mkdirSync(path.join(runRoot, "apps", "domain", "src"), { recursive: true });
  fs.mkdirSync(path.join(runRoot, "apps", "ui"), { recursive: true });
  fs.mkdirSync(path.join(runRoot, "design", "tokens"), { recursive: true });
  fs.mkdirSync(path.join(runRoot, "design-system", "generated"), { recursive: true });
  fs.writeFileSync(path.join(runRoot, "apps", "domain", "src", "main.mjs"), "export {};\n");
  for (const fileName of [
    "fixture-foundation.tokens.json",
    "fixture-default.tokens.json"
  ]) {
    fs.writeFileSync(path.join(runRoot, "design", "tokens", fileName), "{}\n");
  }

  const artifacts = ujg.nodes
    .filter((node) => node["@type"] === "Component" || node["@type"] === "Template")
    .map((node, index) => ({
      ujgRef: node["@id"],
      type: node["@type"],
      module: `./artifact-${index}.tsx`,
      export: `Artifact${index}`
    }));
  fs.writeFileSync(
    path.join(runRoot, "design-system", "generated", "ds-bindings.manifest.json"),
    `${JSON.stringify({ artifacts }, null, 2)}\n`
  );

  assert.equal(
    validateFullApplicationRun({ repoRoot, runsRoot, runName: "completed", phase: "complete" }),
    runRoot
  );

  const projectionPath = path.join(runRoot, "apps", "ui", "transition-map.json");
  fs.writeFileSync(projectionPath, "{}\n");
  assert.throws(
    () => validateFullApplicationRun({ repoRoot, runsRoot, runName: "completed", phase: "complete" }),
    /Prohibited generated projection/
  );
  fs.rmSync(projectionPath);

  ujg.nodes[0].label = "Unauthorized seeded-fact mutation";
  fs.writeFileSync(
    path.join(runRoot, "ujg", "workshop-registration.ujg.jsonld"),
    `${JSON.stringify(ujg, null, 2)}\n`
  );
  assert.throws(
    () => validateFullApplicationRun({ repoRoot, runsRoot, runName: "completed", phase: "complete" }),
    /changed outside the token phase/
  );
  fs.writeFileSync(path.join(runRoot, "ujg", "workshop-registration.ujg.jsonld"), enrichedUjgSource);

  fs.writeFileSync(
    path.join(runRoot, "apps", "ui", "leak.ts"),
    `export const leaked = ${JSON.stringify(ujg.nodes[0]["@id"])};\n`
  );
  assert.throws(
    () => validateFullApplicationRun({ repoRoot, runsRoot, runName: "completed", phase: "complete" }),
    /UJG identifier leaked/
  );
});
