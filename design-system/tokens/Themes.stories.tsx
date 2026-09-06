import type { Meta, StoryObj } from "@storybook/react-vite";

import { storyThemeId, ThemesPage } from "./TokenPages";

const meta = {
  title: "Tokens/Themes",
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Themes: Story = {
  render: (_args, context) => <ThemesPage themeId={storyThemeId(context.globals)} />
};
