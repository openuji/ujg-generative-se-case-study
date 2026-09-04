#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  artifactName,
  designSystemPath,
  expectedManifest,
  manifestPath,
  nodesOfType,
  readUjg,
  stableJson
} from "./ds-utils.mjs";

const errors = [];
const ujg = readUjg();

function fail(message) {
  errors.push(message);
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function walkFiles(dir) {
  if (!exists(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
  });
}

function relative(filePath) {
  return path.relative(process.cwd(), filePath);
}

function validateArtifact(type, rootDirName) {
  const expectedNames = new Set(nodesOfType(ujg, type).map((node) => artifactName(node["@id"])));
  const rootDir = path.join(designSystemPath, rootDirName);

  if (exists(rootDir)) {
    for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
      if (entry.isDirectory() && !expectedNames.has(entry.name)) {
        fail(`${rootDirName}/ contains an extra UJG artifact directory: ${entry.name}.`);
      }
    }
  }

  for (const node of nodesOfType(ujg, type)) {
    const name = artifactName(node["@id"]);
    const dir = path.join(designSystemPath, rootDirName, name);
    const modulePath = path.join(dir, `${name}.tsx`);
    const storyPath = path.join(dir, `${name}.stories.tsx`);

    if (!exists(modulePath)) {
      fail(`${type} ${name} is missing ${relative(modulePath)}.`);
    }

    if (!exists(storyPath)) {
      fail(`${type} ${name} is missing ${relative(storyPath)}.`);
    }
  }
}

function validateNoDirectFiles(dirName) {
  const dir = path.join(designSystemPath, dirName);

  if (!exists(dir)) {
    fail(`Missing ${relative(dir)}.`);
    return;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile()) {
      fail(`Do not place helper files directly under ${dirName}/: ${entry.name}.`);
    }
  }
}

function validateManifest() {
  const expected = stableJson(expectedManifest(ujg));
  const current = exists(manifestPath) ? read(manifestPath) : "";

  if (current !== expected) {
    fail("design-system/generated/ds-bindings.manifest.json is out of sync.");
  }
}

function validateNoUjgIdsInReactFiles() {
  const files = [
    ...walkFiles(path.join(designSystemPath, "components")),
    ...walkFiles(path.join(designSystemPath, "templates")),
    ...walkFiles(path.join(designSystemPath, "primitives")),
    ...walkFiles(path.join(designSystemPath, "src"))
  ].filter((filePath) => /\.(tsx?|jsx?)$/.test(filePath));

  for (const filePath of files) {
    const content = read(filePath);
    if (/urn:ujg:|ujg\/workshop-registration\.ujg\.jsonld|https:\/\/ujg\.specs\.openuji\.org/.test(content)) {
      fail(`UJG identity leaked into React source or stories: ${relative(filePath)}.`);
    }
  }
}

function validatePrimitiveImports() {
  for (const filePath of walkFiles(path.join(designSystemPath, "primitives")).filter((file) => /\.tsx$/.test(file))) {
    const content = read(filePath);
    if (/from\s+["'][^"']*(components|templates)\//.test(content)) {
      fail(`Primitive imports a UJG artifact: ${relative(filePath)}.`);
    }
  }
}

function validateComponentIsolation() {
  for (const filePath of walkFiles(path.join(designSystemPath, "components")).filter((file) => /\.tsx$/.test(file) && !file.endsWith(".stories.tsx"))) {
    const content = read(filePath);
    if (/from\s+["'][^"']*(components|templates)\//.test(content)) {
      fail(`UJG Component imports another UJG artifact: ${relative(filePath)}.`);
    }

    if (/\bworkshops\b\s*[:=]|\bworkshopItems\b|\bworkshopList\b/.test(content)) {
      fail(`UJG Component appears to own the modeled workshop collection: ${relative(filePath)}.`);
    }
  }
}

function validateSurfaceRealizations() {
  const surfaces = new Set(nodesOfType(ujg, "Surface").map((node) => node["@id"]));
  const components = new Set(nodesOfType(ujg, "Component").map((node) => node["@id"]));
  const templates = new Map(nodesOfType(ujg, "Template").map((node) => [node["@id"], new Set(node.slotRefs ?? [])]));
  const slots = new Set(nodesOfType(ujg, "Slot").map((node) => node["@id"]));
  const slotBindings = new Map(nodesOfType(ujg, "SlotBinding").map((node) => [node["@id"], node]));
  const realizationsBySurface = new Map();

  for (const binding of slotBindings.values()) {
    if (!slots.has(binding.slotRef)) {
      fail(`SlotBinding ${binding["@id"]} references missing Slot ${binding.slotRef}.`);
    }

    const targets = [binding.targetSurfaceRef, binding.targetComponentRef].filter(Boolean);
    if (targets.length !== 1) {
      fail(`SlotBinding ${binding["@id"]} must have exactly one target.`);
    }

    if (binding.targetSurfaceRef && !surfaces.has(binding.targetSurfaceRef)) {
      fail(`SlotBinding ${binding["@id"]} references missing Surface ${binding.targetSurfaceRef}.`);
    }

    if (binding.targetComponentRef && !components.has(binding.targetComponentRef)) {
      fail(`SlotBinding ${binding["@id"]} references missing Component ${binding.targetComponentRef}.`);
    }
  }

  for (const realization of nodesOfType(ujg, "SurfaceRealization")) {
    if (!surfaces.has(realization.surfaceRef)) {
      fail(`SurfaceRealization ${realization["@id"]} references missing Surface ${realization.surfaceRef}.`);
    }

    realizationsBySurface.set(realization.surfaceRef, (realizationsBySurface.get(realization.surfaceRef) ?? 0) + 1);

    const hasComponent = Boolean(realization.componentRef);
    const hasTemplate = Boolean(realization.templateRef);

    if (hasComponent === hasTemplate) {
      fail(`SurfaceRealization ${realization["@id"]} must use exactly one of componentRef or templateRef.`);
    }

    if (hasComponent && !components.has(realization.componentRef)) {
      fail(`SurfaceRealization ${realization["@id"]} references missing Component ${realization.componentRef}.`);
    }

    if (hasTemplate) {
      const declaredSlots = templates.get(realization.templateRef);
      if (!declaredSlots) {
        fail(`SurfaceRealization ${realization["@id"]} references missing Template ${realization.templateRef}.`);
      }

      for (const bindingRef of realization.slotBindingRefs ?? []) {
        const binding = slotBindings.get(bindingRef);
        if (!binding) {
          fail(`SurfaceRealization ${realization["@id"]} references missing SlotBinding ${bindingRef}.`);
          continue;
        }

        if (declaredSlots && !declaredSlots.has(binding.slotRef)) {
          fail(`SurfaceRealization ${realization["@id"]} binds undeclared Slot ${binding.slotRef}.`);
        }
      }
    }

    if (hasComponent && realization.slotBindingRefs) {
      fail(`Component-backed SurfaceRealization ${realization["@id"]} must not have slotBindingRefs.`);
    }
  }

  for (const surface of surfaces) {
    if ((realizationsBySurface.get(surface) ?? 0) !== 1) {
      fail(`Surface ${surface} must have exactly one SurfaceRealization.`);
    }
  }
}

validateArtifact("Component", "components");
validateArtifact("Template", "templates");
validateNoDirectFiles("components");
validateNoDirectFiles("templates");
validateManifest();
validateNoUjgIdsInReactFiles();
validatePrimitiveImports();
validateComponentIsolation();
validateSurfaceRealizations();

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("UJG design-system implementation is valid.");
