#!/bin/sh

# Aplica las migraciones de la base de datos
echo "Applying database migrations..."
python manage.py migrate --noinput

# Inicia el servidor (ejecuta el comando principal del Dockerfile o docker-compose)
exec "$@"