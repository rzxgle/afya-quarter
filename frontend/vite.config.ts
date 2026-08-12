import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev: o front chama /api/* e o Vite faz proxy para o backend em :8000.
// Prod: defina VITE_API_URL (ex.: https://afya-quarter-api.onrender.com).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
