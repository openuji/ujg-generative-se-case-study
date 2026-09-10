import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * In development the workshop service runs beside this application on its own
 * port; every request it answers is forwarded to it so the browser only ever
 * talks to one origin.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true
      }
    }
  }
});
