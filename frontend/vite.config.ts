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

    // ✅ Permitir dominio en Vite dev server
    allowedHosts: ["ihexhubs.com", "www.ihexhubs.com"],

    // ✅ Si igual quieres mantener HMR, cámbialo a tu IP nueva
    hmr: {
      host: process.env.VITE_HMR_HOST || "98.89.173.36",
      clientPort: Number(process.env.VITE_HMR_CLIENT_PORT || 30100),
      protocol: "wss", // porque estás entrando por https
    },
  },
});
