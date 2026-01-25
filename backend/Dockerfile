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
# ETAPA DE DESARROLLO (dev)
# --------------------------------------------------------
FROM base AS dev
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# --------------------------------------------------------
# ETAPA DE PRODUCCIÓN (prod)
# --------------------------------------------------------
FROM base AS prod

# 5. Copiar código fuente
COPY . .

# 6. Entrypoint
COPY entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]

EXPOSE 8000
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000"]
