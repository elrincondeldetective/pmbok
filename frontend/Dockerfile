# /webapps/erd-ecosystem/apps/pmbok/frontend/Dockerfile
# --------------------------------------------------------
# 1. ETAPA BASE (Dependencias Compartidas)
# --------------------------------------------------------
FROM node:20-alpine AS base
WORKDIR /app

# Copiamos package.json primero para aprovechar la caché de Docker
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# --------------------------------------------------------
# 2. ETAPA DE DESARROLLO (Lo que usa tu 'task local:up')
# --------------------------------------------------------
FROM base AS dev

# Copiamos el código (aunque el volumen en compose lo sobrescribe, esto es backup)
COPY . .

EXPOSE 5173

# Vite necesita 0.0.0.0 para ser accesible desde fuera del contenedor
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# --------------------------------------------------------
# 3. ETAPA DE CONSTRUCCIÓN (Builder para Producción)
# --------------------------------------------------------
FROM base AS builder

COPY . .

# Argumentos de construcción para inyectar variables de entorno al compilar
# CAMBIO FASE 3.2: Estandarización a VITE_API_BASE_URL (coincide con apiClient.ts)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# --------------------------------------------------------
# 4. ETAPA DE PRODUCCIÓN (Servidor Nginx Final)
# --------------------------------------------------------
FROM nginx:alpine AS prod

# Copiamos la configuración de Nginx (asegúrate de tener este archivo)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos SOLO los archivos estáticos construidos en la etapa 'builder'
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]