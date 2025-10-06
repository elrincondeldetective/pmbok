# backend/Dockerfile

# 1. Imagen base: Usamos una imagen oficial de Python ligera.
FROM public.ecr.aws/docker/library/python:3.11-slim-buster

# 2. Variables de entorno: Optimizan la ejecución de Python en Docker.
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# 3. Directorio de trabajo: Donde vivirá nuestra aplicación dentro del contenedor.
WORKDIR /app

# 4. Instalación de dependencias:
# Copiamos solo el archivo de requerimientos primero para aprovechar el caché de Docker.
COPY requirements.txt .
# Actualizamos pip e instalamos las dependencias.
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copia del código: Copiamos todo el código del backend al contenedor.
COPY . .

# 6. Script de entrada: Hacemos que nuestro script de inicio sea ejecutable.
COPY ./entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# 7. Exponer el puerto: El servidor Gunicorn se ejecutará en el puerto 8000.
EXPOSE 8000

# 8. Punto de entrada: Define el script que se ejecutará al iniciar el contenedor.
ENTRYPOINT ["/app/entrypoint.sh"]
# 9. Comando por defecto: Le dice a entrypoint.sh qué ejecutar.
#    Inicia Gunicorn para servir la aplicación Django.
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000"]