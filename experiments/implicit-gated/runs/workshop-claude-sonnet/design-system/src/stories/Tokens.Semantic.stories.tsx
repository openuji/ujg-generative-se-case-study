import type { Meta, StoryObj } from "@storybook/react-vite";
import manifest from "./token-manifest";
import { ColorSwatch } from "./token-inspector";

const meta: Meta = {
  title: "Tokens/Semantic"
};

export default meta;
type Story = StoryObj;

function groupByRole(paths: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const tokenPath of paths) {
    const role = tokenPath.split(".")[2] ?? "other";
    const existing = groups.get(role) ?? [];
    existing.push(tokenPath);
    groups.set(role, existing);
  }
  return groups;
}

function SemanticRoles({ theme }: { theme: string }) {
  const selected = manifest.themes.find((candidate) => candidate.name === theme) ?? manifest.themes[0];
  const groups = groupByRole(selected.semanticPaths);

  return (
    <div className="p-6 space-y-6" data-theme={selected.name}>
      <p>
        Showing the <strong>{selected.name}</strong> Theme. Switch Themes with the toolbar control above.
      </p>
      {[...groups.entries()].map(([role, paths]) => (
        <section key={role}>
          <h2>{role}</h2>
          {paths.map((tokenPath) => (
            <ColorSwatch key={tokenPath} tokenPath={tokenPath} />
          ))}
        </section>
      ))}
    </div>
  );
}

export const Default: Story = {
  render: (_args, context) => <SemanticRoles theme={String(context.globals.theme ?? "light")} />
};
