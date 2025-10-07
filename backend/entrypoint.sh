#!/bin/sh
# backend/entrypoint.sh

# Salir inmediatamente si un comando falla
set -e

# --- Función para ejecutar comandos y registrar su resultado ---
run_command() {
    echo "▶️  Iniciando: $1"
    # El comando shift mueve los argumentos, así que "$@" ahora contiene el comando real a ejecutar
    shift
    # Ejecuta el comando
    "$@"
    # Verifica el código de salida del comando anterior
    if [ $? -eq 0 ]; then
        echo "✅  Éxito: $1 completado."
    else
        echo "❌  FALLO: $1 no se pudo completar."
        # Salir con un código de error para detener el contenedor
        exit 1
    fi
    echo # Línea en blanco para separar visualmente los logs
}

# --- Secuencia de inicio ---
run_command "Aplicar migraciones de la base de datos" python manage.py migrate --noinput

run_command "Recolectar archivos estáticos" python manage.py collectstatic --noinput

run_command "Poblar DB con procesos PMBOK" python manage.py seed_pmbok

run_command "Poblar DB con procesos Scrum" python manage.py seed_scrum

run_command "Poblar DB con departamentos" python manage.py seed_departments

# --- Iniciar el servidor ---
echo "🚀 Todos los comandos de inicio se completaron con éxito. Iniciando servidor..."
exec "$@"