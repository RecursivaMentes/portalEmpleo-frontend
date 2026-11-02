import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api/auth": {
        target: "http://localhost:5078",
        changeOrigin: true,
      },
      "/api/empleos": {
        target: "http://localhost:5077",
        changeOrigin: true,
      },
      "/api/postulaciones": {
        target: "http://localhost:5077",
        changeOrigin: true,
      },
      "/api/recomendaciones": {
        target: "http://localhost:5080",
        changeOrigin: true,
      },
    },
  },
});
