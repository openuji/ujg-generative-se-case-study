/**
 * Puts the workshop application on the page.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@workshop/design-system/styles.css";
import "./application.css";
import { App } from "./App";

const mount = document.querySelector("#workshop-application");
if (mount === null) throw new Error("The workshop application has nowhere to render.");

createRoot(mount).render(
  <StrictMode>
    <App />
  </StrictMode>
);
