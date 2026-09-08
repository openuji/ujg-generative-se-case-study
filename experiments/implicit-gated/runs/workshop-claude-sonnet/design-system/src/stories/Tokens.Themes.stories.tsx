import type { Meta, StoryObj } from "@storybook/react-vite";
import manifest from "./token-manifest";
import { ColorSwatch } from "./token-inspector";

const meta: Meta = {
  title: "Tokens/Themes"
};

export default meta;
type Story = StoryObj;

function ThemeComparison() {
  const roles = [...new Set(manifest.themes[0]?.semanticPaths.map((tokenPath) => tokenPath.split(".")[2]) ?? [])];

  return (
    <div className="p-6 space-y-4">
      <p>Semantic roles are identical across Themes; only their resolved values differ.</p>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th>Role</th>
            {manifest.themes.map((theme) => (
              <th key={theme.id}>{theme.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role}>
              <td>{role}</td>
              {manifest.themes.map((theme) => {
                const tokenPath = theme.semanticPaths.find((candidate) => candidate.split(".")[2] === role);
                return <td key={theme.id} data-theme={theme.name}>{tokenPath ? <ColorSwatch tokenPath={tokenPath} /> : null}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Default: Story = {
  render: () => <ThemeComparison />
};
