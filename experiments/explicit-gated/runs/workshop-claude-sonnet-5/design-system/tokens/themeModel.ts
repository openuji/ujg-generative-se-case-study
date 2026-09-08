/**
 * Reads the Theme and TokenSource structure straight out of the parsed UJG
 * document. The graph stays the only identity source: nothing here keeps a
 * Theme registry, a token-source catalogue, or a name-to-file mapping of its
 * own.
 */

const themeType = "Theme";
const tokenSourceType = "TokenSource";

export interface TokenSourceDescriptor {
  readonly id: string;
  readonly label: string;
  /** Location as declared by the graph, relative to the UJG document. */
  readonly source: string;
}

export interface ThemeDescriptor {
  readonly id: string;
  /** Stable selector key derived from the graph identity, not authored here. */
  readonly key: string;
  readonly label: string;
  readonly sources: readonly TokenSourceDescriptor[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(node: Record<string, unknown>, key: string): string | undefined {
  const value = node[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function slug(value: string): string {
  return value
    .split(":")
    .filter((segment) => segment.length > 0)
    .slice(-1)[0]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function graphNodes(document: unknown): Record<string, unknown>[] {
  if (!isRecord(document) || !Array.isArray(document.nodes)) {
    throw new Error("UJG document has no node list.");
  }
  return document.nodes.filter(isRecord);
}

export function readTokenSources(document: unknown): Map<string, TokenSourceDescriptor> {
  const sources = new Map<string, TokenSourceDescriptor>();
  for (const node of graphNodes(document)) {
    if (node["@type"] !== tokenSourceType) continue;
    const id = stringField(node, "@id");
    const source = stringField(node, "source");
    if (id === undefined || source === undefined) {
      throw new Error("Every TokenSource must declare an identifier and a source location.");
    }
    sources.set(id, { id, label: stringField(node, "label") ?? slug(id), source });
  }
  return sources;
}

export function readThemes(document: unknown): ThemeDescriptor[] {
  const sources = readTokenSources(document);
  const themes: ThemeDescriptor[] = [];

  for (const node of graphNodes(document)) {
    if (node["@type"] !== themeType) continue;
    const id = stringField(node, "@id");
    const refs = node.tokenSourceRefs;
    if (id === undefined || !Array.isArray(refs) || refs.length === 0) {
      throw new Error("Every Theme must declare an identifier and at least one token source reference.");
    }
    const label = stringField(node, "label") ?? slug(id);
    themes.push({
      id,
      key: slug(id),
      label,
      sources: refs.map((ref) => {
        const descriptor = typeof ref === "string" ? sources.get(ref) : undefined;
        if (descriptor === undefined) throw new Error(`Theme ${label} selects an unknown token source.`);
        return descriptor;
      })
    });
  }

  if (themes.length === 0) throw new Error("UJG document declares no Theme.");
  return themes;
}

export function findTheme(themes: readonly ThemeDescriptor[], name: string): ThemeDescriptor {
  const wanted = name.trim().toLowerCase();
  const pattern = new RegExp(`(^|[^a-z0-9])${wanted.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i");
  const matches = themes.filter(
    (theme) => theme.key === wanted || pattern.test(`${theme.id} ${theme.label}`.toLowerCase())
  );
  if (matches.length !== 1) throw new Error(`Theme name does not select exactly one Theme: ${name}`);
  return matches[0];
}
