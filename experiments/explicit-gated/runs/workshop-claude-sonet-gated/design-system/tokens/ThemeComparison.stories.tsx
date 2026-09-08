import type { Meta, StoryObj } from "@storybook/react";
import { ThemeComparisonPage } from "./TokenGallery";

const meta: Meta = {
  title: "Tokens/Theme comparison",
  parameters: { controls: { disable: true } }
};

export default meta;

type Story = StoryObj;

export const SemanticRoles: Story = {
  name: "Semantic roles",
  render: () => <ThemeComparisonPage />
};
