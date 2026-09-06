import fs from "node:fs";
import path from "node:path";

export const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
export const ujgPath = path.join(repoRoot, "ujg/workshop-registration.ujg.jsonld");
export const designSystemPath = path.join(repoRoot, "design-system");
export const manifestPath = path.join(designSystemPath, "generated/ds-bindings.manifest.json");

export function readUjg() {
  return JSON.parse(fs.readFileSync(ujgPath, "utf8"));
}

export function nodesOfType(ujg, type) {
  return ujg.nodes.filter((node) => node["@type"] === type);
}

export function artifactName(id) {
  const localName = id.split(":").at(-1);
  if (!localName) {
    throw new Error(`Cannot derive artifact name from ${id}`);
  }

  return localName
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join("");
}

export function artifactEntry(node) {
  const type = node["@type"];
  const exportName = artifactName(node["@id"]);
  const folder = type === "Component" ? "components" : "templates";

  return {
    ujgRef: node["@id"],
    type,
    module: `${folder}/${exportName}/${exportName}.tsx`,
    export: exportName
  };
}

export function expectedManifest(ujg = readUjg()) {
  const artifacts = [...nodesOfType(ujg, "Component"), ...nodesOfType(ujg, "Template")].map(artifactEntry);

  return {
    source: "ujg/workshop-registration.ujg.jsonld",
    artifacts
  };
}

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
