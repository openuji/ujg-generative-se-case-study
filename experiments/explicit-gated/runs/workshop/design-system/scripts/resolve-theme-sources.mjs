import { readFileSync } from "node:fs";

const documentUrl = new URL("../../ujg/workshop-registration.ujg.jsonld", import.meta.url);
const documentModel = JSON.parse(readFileSync(documentUrl, "utf8"));
const sources = new Map(
  documentModel.nodes
    .filter((node) => node["@type"] === "TokenSource")
    .map((node) => [node["@id"], node])
);
const themes = documentModel.nodes.filter((node) => node["@type"] === "Theme");

for (const theme of themes) {
  for (const ref of theme.tokenSourceRefs) {
    const source = sources.get(ref);
    if (!source) throw new Error("Theme references a missing token source.");
    JSON.parse(readFileSync(new URL(source.source, documentUrl), "utf8"));
  }
}

console.log(`Resolved ${themes.length} themes.`);
