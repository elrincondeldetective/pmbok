#!/bin/bash
# /webapps/erd-ecosystem/apps/pmbok/frontend/simulate-amplify-build.sh

# Falla el script si cualquier comando falla
set -e

# --- INICIO DE LA SIMULACIÓN ---
echo "🔵 [SIMULACIÓN AMPLIFY] Iniciando build local..."

# 1. Limpieza: Elimina instalaciones y builds anteriores
echo "🧹 Limpiando directorio de build (dist) y node_modules..."
rm -rf ./dist
rm -rf ./node_modules

# 2. Instalación Limpia: Usa 'npm ci' como lo haría Amplify
echo "📦 Instalando dependencias limpiamente con 'npm ci'..."
npm ci

# 3. Build: Ejecuta el mismo comando de build de tu amplify.yml
echo "🏗️ Construyendo la aplicación con 'npm run build'..."
# CAMBIO FASE 3.2: Usar variable estándar VITE_API_BASE_URL
# Usamos una ruta relativa (/api) como se recomienda en apiClient.ts
VITE_API_BASE_URL="/api" npm run build

# --- FIN DE LA SIMULACIÓN ---
echo "✅ [SIMULACIÓN AMPLIFY] ¡El build se completó exitosamente!"
echo "✨ Tu entorno local es consistente con las reglas de Amplify."