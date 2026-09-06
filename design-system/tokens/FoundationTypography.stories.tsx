import type { Meta, StoryObj } from "@storybook/react-vite";

import { storyThemeId, TokenGroupPage } from "./TokenPages";

const meta = {
  title: "Tokens/Foundation/Typography",
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Typography: Story = {
  render: (_args, context) => (
    <TokenGroupPage
      themeId={storyThemeId(context.globals)}
      title="Foundation Typography"
      description="Font family, size, weight, and line-height tokens."
      prefixes={["font.family", "font.size", "font.weight", "font.lineHeight"]}
      source="foundation"
      variant="typography"
    />
  )
};
