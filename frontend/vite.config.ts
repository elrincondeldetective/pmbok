// apps/pmbok/frontend/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,

    // ✅ Permitir que Vite responda cuando el Host sea tu dominio real
    allowedHosts: ["ihexhubs.com", "www.ihexhubs.com"],

    // (Opcional) HMR: en producción NO lo necesitas.
    // Si lo dejas, al entrar por https usa wss.
    hmr: {
      host: process.env.VITE_HMR_HOST || "ihexhubs.com", // o "98.89.173.36"
      clientPort: Number(process.env.VITE_HMR_CLIENT_PORT || 443),
      protocol: "wss",
    },
  },
});
