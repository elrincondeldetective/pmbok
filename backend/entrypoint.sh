#!/bin/sh

# Salir inmediatamente si un comando falla
set -e

# 1. Aplicar migraciones de la base de datos
echo "Applying database migrations..."
python manage.py migrate --noinput

# 2. Recolectar archivos estáticos
echo "Collecting static files..."
python manage.py collectstatic --noinput

# 3. Ejecutar los comandos para poblar la base de datos (seeds)
echo "Seeding database with PMBOK processes..."
python manage.py seed_pmbok

echo "Seeding database with Scrum processes..."
python manage.py seed_scrum

echo "Seeding database with departments..."
python manage.py seed_departments

# 4. Iniciar el servidor (ejecuta el comando principal del Dockerfile o docker-compose)
echo "Starting server..."
exec "$@"