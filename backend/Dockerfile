# /webapps/erd-ecosystem/apps/pmbok/backend/Dockerfile

FROM python:3.12-slim AS base

# Evitar .pyc y logs buferizados
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Dependencias de sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# 1) Instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2) Copiar el código del backend
COPY . .

# 3) Copiar y preparar el entrypoint
#    (se copia fuera de /app para que el volumen no lo pise)
COPY entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8000

ENV DJANGO_SETTINGS_MODULE=core.settings

# 4) Usar el entrypoint que corre migraciones/seeds y luego lanza el comando
ENTRYPOINT ["/docker-entrypoint.sh"]

# 5) En local seguimos usando el runserver de Django
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
