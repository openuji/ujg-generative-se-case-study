import type { Meta, StoryObj } from "@storybook/react-vite";
import manifest from "./token-manifest";
import { ShadowSwatch, SpacingSwatch, TextSampleSwatch } from "./token-inspector";

const meta: Meta = {
  title: "Tokens/Foundation"
};

export default meta;
type Story = StoryObj;

function FoundationGroups() {
  return (
    <div className="p-6 space-y-6">
      {Object.entries(manifest.foundationGroups).map(([group, paths]) => (
        <section key={group}>
          <h2>{group}</h2>
          {paths.map((tokenPath) => {
            if (group === "dimension" && tokenPath.includes(".spacing.")) {
              return <SpacingSwatch key={tokenPath} tokenPath={tokenPath} />;
            }
            if (group === "shadow") {
              return <ShadowSwatch key={tokenPath} tokenPath={tokenPath} />;
            }
            if (group === "fontFamily") {
              return <TextSampleSwatch key={tokenPath} tokenPath={tokenPath} kind="fontFamily" />;
            }
            if (group === "fontWeight") {
              return <TextSampleSwatch key={tokenPath} tokenPath={tokenPath} kind="fontWeight" />;
            }
            if (group === "lineHeight") {
              return <TextSampleSwatch key={tokenPath} tokenPath={tokenPath} kind="lineHeight" />;
            }
            if (tokenPath.includes(".fontSize.")) {
              return <TextSampleSwatch key={tokenPath} tokenPath={tokenPath} kind="fontSize" />;
            }
            return <SpacingSwatch key={tokenPath} tokenPath={tokenPath} />;
          })}
        </section>
      ))}
    </div>
  );
}

export const Default: Story = {
  render: () => <FoundationGroups />
};
