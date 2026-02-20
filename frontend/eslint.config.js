// /webapps/erd-ecosystem/apps/pmbok/frontend/eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    // --- NUEVO: Sobreescribimos las reglas estrictas ---
    rules: {
      // Convertimos el error de 'any' en advertencia
      '@typescript-eslint/no-explicit-any': 'warn',
      // Convertimos el error de exportación de componentes en advertencia
      'react-refresh/only-export-components': 'warn',
      // Si usas variables que no usas (ej. imports), también suele dar error, lo bajamos a warn por si acaso
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
])