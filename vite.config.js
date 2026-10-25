import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api/empleos": {
        target: "http://localhost:5082",
        changeOrigin: true,
      },
      "/api/recomendaciones": {
        target: "http://localhost:5080",
        changeOrigin: true,
      },
    },
  },
});