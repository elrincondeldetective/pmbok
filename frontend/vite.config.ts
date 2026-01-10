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
    hmr: {
      // Host público (IP/DNS desde donde entras al NodePort)
      host: process.env.VITE_HMR_HOST || "3.215.182.51",
      // Puerto público (NodePort)
      clientPort: Number(process.env.VITE_HMR_CLIENT_PORT || 30100),
      protocol: "ws",
    },
  },
});
