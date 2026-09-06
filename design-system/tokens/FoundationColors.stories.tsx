import type { Meta, StoryObj } from "@storybook/react-vite";

import { storyThemeId, TokenGroupPage } from "./TokenPages";

const meta = {
  title: "Tokens/Foundation/Colors",
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Colors: Story = {
  render: (_args, context) => (
    <TokenGroupPage
      themeId={storyThemeId(context.globals)}
      title="Foundation Colors"
      description="Direct color decisions from the workshop visual direction."
      prefixes={["color"]}
      source="foundation"
      variant="color"
    />
  )
};
