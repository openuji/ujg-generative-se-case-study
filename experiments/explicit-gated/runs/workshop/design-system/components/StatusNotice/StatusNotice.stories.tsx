import type { Meta, StoryObj } from "@storybook/react-vite";
import { noticeData } from "../../src/fixtures";
import { StatusNotice } from "./StatusNotice";

const meta = {
  title: "Components/StatusNotice",
  component: StatusNotice
} satisfies Meta<typeof StatusNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Notice: Story = {
  args: noticeData
};
