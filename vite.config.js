import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: "127.0.0.1"
  },
  build: {
    // src/App.jsx is a single ~1.5 MB monolith with embedded basemap/data;
    // raise the warning limit instead of splitting the prototype.
    chunkSizeWarningLimit: 4000
  }
});
