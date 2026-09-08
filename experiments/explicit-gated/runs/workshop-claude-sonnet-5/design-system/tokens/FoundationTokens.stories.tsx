import type { Meta, StoryObj } from "@storybook/react";
import { GroupPage } from "./TokenGallery";

const meta: Meta = {
  title: "Tokens/Foundation",
  parameters: { controls: { disable: true } }
};

export default meta;

type Story = StoryObj;

function page(group: string, title: string, description: string): Story {
  return {
    render: (_args, context) => (
      <GroupPage
        themeKey={String(context.globals.theme ?? "")}
        layer="foundation"
        group={group}
        title={title}
        description={description}
      />
    )
  };
}

export const Color: Story = page(
  "color",
  "Foundation · colour ramps",
  "Raw hues shared by every Theme. Steps sampled from the reference screens carry direct provenance; interpolated steps that fill out the ramp are marked inferred."
);

export const Space: Story = page(
  "space",
  "Foundation · spacing scale",
  "Four-pixel spacing scale proportioned against the reference layout gutters, stack rhythm and control padding."
);

export const Size: Story = page(
  "size",
  "Foundation · sizing",
  "Interactive box sizes and the content column width, measured off the reference control geometry."
);

export const Radius: Story = page(
  "radius",
  "Foundation · corner radii",
  "Corner radii read off card, control and chip geometry in the reference screens."
);

export const BorderWidth: Story = page(
  "borderWidth",
  "Foundation · border widths",
  "Stroke widths for hairline outlines and the emphasis rule used by selected navigation."
);

export const FocusRing: Story = page(
  "focusRing",
  "Foundation · focus ring geometry",
  "Focus indicator geometry. No reference screen captures a keyboard focus state, so the geometry is a projection of the emphasis stroke and is recorded as inferred."
);

export const Font: Story = page(
  "font",
  "Foundation · typography",
  "Family, size, weight and line-height primitives. Mixed value types appear as labelled sections rather than separate categories."
);

export const Shadow: Story = page(
  "shadow",
  "Foundation · elevation",
  "Elevation steps derived from the very low-contrast card lift visible in the reference screens."
);
