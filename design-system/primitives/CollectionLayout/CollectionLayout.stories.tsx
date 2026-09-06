import type { Meta, StoryObj } from "@storybook/react-vite";
import { CollectionLayout } from "./CollectionLayout";

const meta = {
  title: "Primitives/CollectionLayout",
  component: CollectionLayout
} satisfies Meta<typeof CollectionLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Items",
    children: (
      <>
        <article>First item</article>
        <article>Second item</article>
      </>
    )
  }
};
