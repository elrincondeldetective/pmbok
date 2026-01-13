# /webapps/erd-ecosystem/apps/pmbok/backend/Dockerfile
FROM python:3.12-slim

# Evitar .pyc y logs buferizados
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# 1. Dependencias del sistema
# Incluimos 'git' para evitar errores si alguna librería lo necesita o para el chequeo de seguridad
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    git \
 && rm -rf /var/lib/apt/lists/*

# 2. Configuración de Git (Crítico para volúmenes en desarrollo)
# Esto evita el error "dubious ownership" cuando mapeas tu carpeta local dentro del contenedor
RUN git config --system --add safe.directory '*'

# 3. Instalación de Poetry
# Usamos Poetry para mantener la consistencia con tu entorno local
RUN pip install --no-cache-dir poetry

# 4. Instalar dependencias del Proyecto
# Copiamos solo los archivos de definición primero para aprovechar la caché de Docker
COPY pyproject.toml poetry.lock ./

# Configuramos poetry para NO crear un entorno virtual dentro del contenedor
# (ya que el contenedor en sí mismo es un entorno aislado)
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi

# 5. Copiar el resto del código
COPY . .

# 6. Entrypoint (Opcional / Comentado por seguridad)
# Si tienes un archivo 'entrypoint.sh' real, descomenta las siguientes líneas.
# Si no lo tienes, déjalas comentadas para evitar errores de "file not found".
# COPY entrypoint.sh /docker-entrypoint.sh
# RUN chmod +x /docker-entrypoint.sh
# ENTRYPOINT ["/docker-entrypoint.sh"]

EXPOSE 8000

# 7. Comando por defecto
# Como deshabilitamos el venv de poetry arriba, podemos llamar a python directo
# o usar poetry run (ambos funcionarán).
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]