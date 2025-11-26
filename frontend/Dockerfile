# /webapps/erd-ecosystem/apps/pmbok/frontend/Dockerfile
# apps/pmbok/frontend/Dockerfile

FROM node:20-alpine

# Crear directorio de trabajo
WORKDIR /app

# 1) Copiar archivos de dependencias
# Si tienes package-lock.json o pnpm-lock.yaml, puedes añadirlos también
COPY package.json ./
# Descomenta una de estas líneas si corresponde:
# COPY package-lock.json ./
# COPY pnpm-lock.yaml ./

# Instalar dependencias
RUN npm install

# 2) Copiar el resto del código del frontend
COPY . .

# Vite usa 5173 por defecto
EXPOSE 5173

# Servidor de desarrollo de Vite, accesible desde fuera del contenedor
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
