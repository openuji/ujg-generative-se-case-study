import type { Meta, StoryObj } from "@storybook/react-vite";

import { storyThemeId, TokenGroupPage } from "./TokenPages";

const meta = {
  title: "Tokens/Semantic/Text",
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Text: Story = {
  render: (_args, context) => (
    <TokenGroupPage
      themeId={storyThemeId(context.globals)}
      title="Semantic Text"
      description="Readable foreground roles resolved for the selected theme."
      prefixes={["text"]}
      source="semantic"
      variant="color"
    />
  )
};
