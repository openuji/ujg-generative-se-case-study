import type { Meta, StoryObj } from "@storybook/react";
import { GroupPage } from "./TokenGallery";

const meta: Meta = {
  title: "Tokens/Semantic roles",
  parameters: { controls: { disable: true } }
};

export default meta;

type Story = StoryObj;

function page(group: string, title: string, description: string): Story {
  return {
    render: (_args, context) => (
      <GroupPage
        themeKey={String(context.globals.theme ?? "")}
        layer="semantic"
        group={group}
        title={title}
        description={description}
      />
    )
  };
}

export const Surface: Story = page(
  "color.surface",
  "Semantic · surface",
  "Background roles for the application canvas, panels and tinted regions. Every role aliases a foundation ramp step rather than repeating a raw value."
);

export const Text: Story = page(
  "color.text",
  "Semantic · text",
  "Foreground ink ordered by hierarchy, plus the ink used on saturated fills."
);

export const Border: Story = page(
  "color.border",
  "Semantic · border",
  "Stroke roles for outlines, dividers and the accented selection rule."
);

export const Action: Story = page(
  "color.action",
  "Semantic · action",
  "Primary, secondary and destructive command treatments. Sections mirror the treatments observed in the reference screens."
);

export const Control: Story = page(
  "color.control",
  "Semantic · control",
  "Form control roles for text inputs, selects and text areas."
);

export const Focus: Story = page(
  "color.focus",
  "Semantic · focus",
  "Focus indicator colour. The reference screens never capture a keyboard focus state, so the role reuses the accent hue those screens do show on the selected navigation rule and the primary command fill."
);

export const Status: Story = page(
  "color.status",
  "Semantic · status",
  "Availability, outcome and notice messaging: positive, caution, destructive, informational and inert."
);
