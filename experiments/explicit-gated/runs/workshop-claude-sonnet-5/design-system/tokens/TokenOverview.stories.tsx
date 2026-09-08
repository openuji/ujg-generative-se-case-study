import type { Meta, StoryObj } from "@storybook/react";
import { OverviewPage } from "./TokenGallery";

const meta: Meta = {
  title: "Tokens/Overview",
  parameters: { controls: { disable: true } }
};

export default meta;

type Story = StoryObj;

export const Overview: Story = {
  name: "Overview",
  render: (_args, context) => <OverviewPage themeKey={String(context.globals.theme ?? "")} />
};
