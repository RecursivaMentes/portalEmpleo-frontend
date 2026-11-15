import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api/empleos": {
        target: "http://localhost:5077",
        changeOrigin: true,
      },
      "/api/recomendaciones": {
        target: "http://localhost:5080",
        changeOrigin: true,
      },
      "/api/cvs": {
        target: "http://localhost:5078",
        changeOrigin: true,
      },
      "/api/generacion-cv": {
        target: "http://localhost:5079",
        changeOrigin: true,
      },
    },
  },
});
