import type { Meta, StoryObj } from "@storybook/react-vite";
import manifest from "./token-manifest";

const meta: Meta = {
  title: "Tokens/Overview"
};

export default meta;
type Story = StoryObj;

function Overview() {
  const foundationGroupCount = Object.keys(manifest.foundationGroups).length;
  const semanticRoleCount = manifest.themes[0]?.semanticPaths.length ?? 0;

  return (
    <div className="p-6 space-y-4">
      <h1>Design tokens</h1>
      <p>
        Resolved live from the run-local UJG&apos;s <code>Theme → TokenSource → DTCG</code> chain. Nothing on this
        page is a hardcoded value list.
      </p>
      <dl>
        <div>
          <dt>Themes</dt>
          <dd>{manifest.themes.map((theme) => theme.name).join(", ")}</dd>
        </div>
        <div>
          <dt>Foundation groups</dt>
          <dd>{foundationGroupCount}</dd>
        </div>
        <div>
          <dt>Semantic roles per theme</dt>
          <dd>{semanticRoleCount}</dd>
        </div>
      </dl>
    </div>
  );
}

export const Default: Story = {
  render: () => <Overview />
};
