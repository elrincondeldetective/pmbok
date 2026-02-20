// apps/pmbok/frontend/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(() => {
  const hmrHost = process.env.VITE_HMR_HOST; // si existe, asumimos entorno remoto con https/wss
  const isRemoteHmr = Boolean(hmrHost);

  return {
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

      /**
       * ✅ Importante para local con Traefik:
       * Accedes por: http://pmbok.localhost:<PUERTO>/
       * Entonces debes permitir ese host (y localhost/127.0.0.1).
       */
      allowedHosts: ["localhost", "127.0.0.1", "pmbok.localhost", "ihexhubs.com", "www.ihexhubs.com"],

      /**
       * ✅ HMR:
       * - Local (Traefik/http): NO forces host/puerto/protocolo → Vite detecta y funciona.
       * - Remoto (si defines VITE_HMR_HOST): configura wss/443 (o lo que necesites).
       */
      hmr: isRemoteHmr
        ? {
          host: hmrHost!,
          clientPort: Number(process.env.VITE_HMR_CLIENT_PORT || 443),
          protocol: (process.env.VITE_HMR_PROTOCOL as "ws" | "wss") || "wss",
        }
        : undefined,
    },
  };
});
