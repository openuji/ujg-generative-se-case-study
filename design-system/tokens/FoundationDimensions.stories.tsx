import type { Meta, StoryObj } from "@storybook/react-vite";

import { storyThemeId, TokenGroupPage } from "./TokenPages";

const meta = {
  title: "Tokens/Foundation/Dimensions",
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Dimensions: Story = {
  render: (_args, context) => (
    <TokenGroupPage
      themeId={storyThemeId(context.globals)}
      title="Foundation Dimensions"
      description="Spacing, radii, and border-width decisions grouped by source-model prefix."
      prefixes={["space", "radius", "border.width"]}
      source="foundation"
      variant="dimension"
    />
  )
};
