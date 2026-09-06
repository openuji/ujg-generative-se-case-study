import type { Meta, StoryObj } from "@storybook/react-vite";

import { OverviewPage, storyThemeId } from "./TokenPages";

const meta = {
  title: "Tokens/Overview",
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: (_args, context) => <OverviewPage themeId={storyThemeId(context.globals)} />
};
