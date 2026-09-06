import type { Meta, StoryObj } from "@storybook/react-vite";

import { storyThemeId, TokenGroupPage } from "./TokenPages";

const meta = {
  title: "Tokens/Semantic/Controls",
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Controls: Story = {
  render: (_args, context) => (
    <TokenGroupPage
      themeId={storyThemeId(context.globals)}
      title="Semantic Controls"
      description="Input/control backgrounds, borders, focus, and placeholder roles."
      prefixes={["control"]}
      source="semantic"
      variant="color"
    />
  )
};
