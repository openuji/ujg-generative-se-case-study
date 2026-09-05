import type { Meta, StoryObj } from "@storybook/react-vite";

import { storyThemeId, TokenGroupPage } from "./TokenPages";

const meta = {
  title: "Tokens/Semantic/Surfaces",
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Surfaces: Story = {
  render: (_args, context) => (
    <TokenGroupPage
      themeId={storyThemeId(context.globals)}
      title="Semantic Surfaces"
      description="Canvas, default, subtle, and accent surface roles."
      prefixes={["surface"]}
      source="semantic"
      variant="color"
    />
  )
};
