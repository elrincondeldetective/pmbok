# frontend/Dockerfile

# 1. Imagen base: Usamos una imagen oficial y ligera de Node.js.
FROM node:20-alpine

# 2. Directorio de trabajo: Donde vivirá la app dentro del contenedor.
WORKDIR /app

# 3. Copiar dependencias: Copiamos primero estos archivos para usar el caché de Docker.
COPY package.json package-lock.json ./
# (Si usas yarn o pnpm, copia yarn.lock o pnpm-lock.yaml en su lugar)

# 4. Instalar dependencias:
RUN npm install

# 5. Copiar el resto del código:
COPY . .

# 6. Exponer el puerto: El servidor de desarrollo de Vite corre en el puerto 5173.
EXPOSE 5173

# 7. Comando de inicio: Ejecuta el script 'dev' para iniciar el servidor.
CMD ["npm", "run", "dev"]