import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@openuji/workshop-registration-design-system/styles.css";
import "./app.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
