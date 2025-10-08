# backend/Dockerfile

# 1. Imagen base
FROM public.ecr.aws/docker/library/python:3.11-slim-buster

# 2. Variables de entorno
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# 3. Directorio de trabajo
WORKDIR /app

# 4. Copia del código de backend al contenedor
# Copia todo el contenido de la carpeta 'backend' local a la carpeta de trabajo '/app'
COPY ./backend/ .

# 5. Instalación de dependencias
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# 6. Exponer el puerto
EXPOSE 8000

# 7. Comando por defecto (no es necesario entrypoint.sh para este caso)
RUN python manage.py collectstatic --noinput
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000"]