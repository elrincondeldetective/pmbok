// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path' // 👈 AÑADE ESTA LÍNEA

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  // 👇 AÑADE ESTA SECCIÓN COMPLETA
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})