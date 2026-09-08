import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@workshop-claude-sonnet/design-system";
import "@workshop-claude-sonnet/design-system/styles.css";
import "./styles/app.css";
import { App } from "./App";
import { RouterProvider } from "./router";

const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
document.documentElement.setAttribute("data-theme", preferredTheme);

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element.");

createRoot(container).render(
  <StrictMode>
    <RouterProvider>
      <App />
    </RouterProvider>
  </StrictMode>
);
