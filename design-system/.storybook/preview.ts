import React, { type CSSProperties } from "react";
import type { Preview } from "@storybook/react-vite";

import { getThemes, themeCssProperties, themeIdFromGlobal, themeSlug } from "../tokens/token-system";
import "../tokens/tailwind.css";

const themes = getThemes();
const defaultTheme = themes[0]?.id ?? "";
const defaultThemeSelection = themeSlug(defaultTheme);

const preview: Preview = {
  globalTypes: {
    ujgTheme: {
      name: "UJG Theme",
      defaultValue: defaultThemeSelection,
      toolbar: {
        icon: "paintbrush",
        items: themes.map((theme) => ({
          value: themeSlug(theme.id),
          title: themeSlug(theme.id)
        })),
        dynamicTitle: true
      }
    }
  },
  decorators: [
    (Story, context) => {
      const themeId = themeIdFromGlobal(context.globals.ujgTheme ?? defaultTheme);
      const frame = context.parameters.ujgFrame;
      const maxWidth = frame === "list" ? "80rem" : frame === "wide" ? "56rem" : "34rem";
      const style = {
        ...themeCssProperties(themeId),
        minHeight: "100vh"
      } as CSSProperties;
      const story = React.createElement(Story);
      const framedStory =
        context.parameters.layout === "fullscreen"
          ? story
          : React.createElement(
              "div",
              {
                style: {
                  margin: "0 auto",
                  maxWidth,
                  width: "100%"
                } as CSSProperties
              },
              story
            );

      return React.createElement(
        "div",
        {
          className: "min-h-screen bg-surface-canvas p-4 font-sans text-text-default sm:p-8",
          "data-ujg-theme": themeSlug(themeId),
          style
        },
        framedStory
      );
    }
  ],
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    viewport: {
      viewports: {
        ujgMobile: {
          name: "UJG mobile",
          styles: {
            width: "390px",
            height: "844px"
          }
        },
        ujgDesktop: {
          name: "UJG desktop",
          styles: {
            width: "1280px",
            height: "900px"
          }
        }
      }
    }
  }
};

export default preview;
