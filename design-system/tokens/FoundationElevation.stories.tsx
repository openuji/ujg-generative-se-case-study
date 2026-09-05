import type { Meta, StoryObj } from "@storybook/react-vite";

import { storyThemeId, TokenGroupPage } from "./TokenPages";

const meta = {
  title: "Tokens/Foundation/Elevation",
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Elevation: Story = {
  render: (_args, context) => (
    <TokenGroupPage
      themeId={storyThemeId(context.globals)}
      title="Foundation Elevation"
      description="Shadow decisions available to semantic elevation roles."
      prefixes={["shadow"]}
      source="foundation"
      variant="shadow"
    />
  )
};
