#!/usr/bin/env sh
# backend/entrypoint.sh
set -e

log() { echo "[$(date -Is)] $*"; }

run() {
  desc="$1"; shift
  log "▶ $desc"
  "$@"
  log "✅ $desc"
}

# --- Comprobación básica de variables (solo aviso) ---
for v in DB_NAME DB_USER DB_PASSWORD DB_HOST; do
  eval "val=\${$v:-}"
  [ -z "$val" ] && log "⚠ $v no está definida (si Django la requiere, fallará)."
done

# Toggles (puedes controlarlos con vars en EB)
: "${RUN_MIGRATIONS:=1}"
: "${RUN_COLLECTSTATIC:=1}"
: "${RUN_SEED:=0}"

# --- Migraciones con reintentos (útil si la DB tarda en estar lista) ---
if [ "$RUN_MIGRATIONS" = "1" ]; then
  log "▶ Aplicar migraciones de la base de datos"
  tries=0
  until python manage.py migrate --noinput; do
    code=$?
    tries=$((tries+1))
    if [ "$tries" -ge 5 ]; then
      log "❌ Migraciones fallaron tras $tries intentos (exit $code)"
      exit "$code"
    fi
    log "⏳ Reintentando migraciones en 5s (intento $((tries+1))/5)…"
    sleep 5
  done
  log "✅ Migraciones aplicadas"
fi

# --- Archivos estáticos ---
if [ "$RUN_COLLECTSTATIC" = "1" ]; then
  run "Recolectar archivos estáticos" python manage.py collectstatic --noinput
fi

# --- Seeds opcionales (ejecútalos solo cuando quieras) ---
if [ "$RUN_SEED" = "1" ]; then
  run "Poblar DB con procesos PMBOK" python manage.py seed_pmbok
  run "Poblar DB con procesos Scrum" python manage.py seed_scrum
  run "Poblar DB con departamentos" python manage.py seed_departments
fi

# --- Iniciar el servidor ---
log "🚀 Iniciando: $*"
exec "$@"
