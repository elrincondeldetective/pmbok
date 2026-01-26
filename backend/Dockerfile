# /webapps/erd-ecosystem/apps/pmbok/backend/Dockerfile
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# 1. Dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    git \
 && rm -rf /var/lib/apt/lists/*

# 2. Configuración Git
RUN git config --system --add safe.directory '*'

# 3. Poetry
RUN pip install --no-cache-dir poetry

# 4. Dependencias Python
COPY pyproject.toml poetry.lock ./
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi

# --------------------------------------------------------
<<<<<<< HEAD
# ETAPA DE DESARROLLO (Lo que usa docker compose / minikube dev)
# --------------------------------------------------------
FROM base AS dev
# En dev generalmente no copiamos código porque se monta como volumen,
# pero el CMD por defecto es útil para arrancar.
=======
# ETAPA DE DESARROLLO (dev)
# --------------------------------------------------------
FROM base AS dev
>>>>>>> feature/detached-b50af15
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# --------------------------------------------------------
<<<<<<< HEAD
# ETAPA DE PRODUCCIÓN (Imagen final para Deploy)
# --------------------------------------------------------
FROM base AS prod

# 5. Copiar el resto del código
# En producción SÍ copiamos el código dentro de la imagen.
COPY . .

# 6. Entrypoint REAL (Habilitado)
# Usamos el script entrypoint.sh para migraciones y validaciones previas
=======
# ETAPA DE PRODUCCIÓN (prod)
# --------------------------------------------------------
FROM base AS prod

# 5. Copiar código fuente
COPY . .

# 6. Entrypoint
>>>>>>> feature/detached-b50af15
COPY entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]

EXPOSE 8000
<<<<<<< HEAD

# 7. Comando por defecto
# En producción usamos Gunicorn en lugar de runserver
=======
>>>>>>> feature/detached-b50af15
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000"]