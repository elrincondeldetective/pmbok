#!/usr/bin/env sh
# /webapps/erd-ecosystem/apps/pmbok/backend/entrypoint.sh
set -e

log() { echo "[$(date -Is)] $*"; }

run() {
  desc="$1"; shift
  log "▶ $desc"
  "$@"
  log "✅ $desc"
}

# --- Avisos de variables de entorno básicas (no bloquea el arranque) ---
for v in DB_NAME DB_USER DB_PASSWORD DB_HOST; do
  eval "val=\${$v:-}"
  [ -z "$val" ] && log "⚠ $v no está definida (si Django la requiere, fallará)."
done

# Toggles controlables desde Elastic Beanstalk (Configuration → Software)
: "${RUN_MIGRATIONS:=1}"     # 1/0
: "${RUN_COLLECTSTATIC:=1}"  # 1/0
: "${RUN_SEED:=always}"        # auto | always | skip  (auto = sólo si faltan datos)

# --- Migraciones con reintentos (por si la DB tarda en estar lista) ---
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

# --- Seeds ---
case "$RUN_SEED" in
  always|1)
    run "Poblar DB con procesos PMBOK" python manage.py seed_pmbok
    run "Poblar DB con procesos Scrum" python manage.py seed_scrum
    run "Poblar DB con departamentos" python manage.py seed_departments
    ;;
  auto)
    log "▶ Verificando si es necesario poblar datos (modo auto)…"
    python - <<'PY'
import os, subprocess, sys
os.environ.setdefault("DJANGO_SETTINGS_MODULE","core.settings")
import django
django.setup()
from django.apps import apps

def count(model):
    try:
        return apps.get_model("api", model).objects.count()
    except Exception:
        return None

checks = [
    ("PMBOKProcess",   ["python","manage.py","seed_pmbok"]),
    ("ScrumProcess",   ["python","manage.py","seed_scrum"]),
    ("Department",     ["python","manage.py","seed_departments"]),
]
to_run = []
for model, cmd in checks:
    c = count(model)
    print(f"[seed:auto] {model}: {c}")
    if c in (None, 0):
        to_run.append(cmd)

if not to_run:
    print("[seed:auto] Seeds omitidos (ya hay datos).")
else:
    print("[seed:auto] Faltan datos; ejecutando seeds…")
    for cmd in to_run:
        print("▶", " ".join(cmd))
        subprocess.check_call(cmd)
PY
    ;;
  skip|0)
    log "↷ Seeds omitidos (RUN_SEED=skip)."
    ;;
esac

# --- AUTO-TUNE DE GUNICORN (workers / timeout) ---
# Sólo se aplica si el comando es 'gunicorn'.
# - Si YA pasaste --workers/--timeout en el CMD, NO se tocan, a menos que GUNICORN_FORCE_AUTOTUNE=1.
# - Fórmula workers (CPU): 2*CPU + 1, limitado por RAM: MEM_TOTAL_MB / MEM_PER_WORKER_MB.
# - Valores por defecto pensados para t3.small/medium (RAM ajusta el límite real).
GUNICORN_AUTOTUNE="${GUNICORN_AUTOTUNE:-1}"
if [ "$GUNICORN_AUTOTUNE" = "1" ] && [ "${1:-}" = "gunicorn" ]; then
  FORCE="${GUNICORN_FORCE_AUTOTUNE:-0}"

  has_arg() { printf ' %s ' "$*" | grep -q " $1 "; }

  WANT_WORKERS="${GUNICORN_WORKERS:-auto}"
  WANT_TIMEOUT="${GUNICORN_TIMEOUT:-auto}"
  WORKER_CLASS="${GUNICORN_WORKER_CLASS:-sync}"
  MEM_PER="${MEM_PER_WORKER_MB:-180}"
  MAX_WORKERS="${GUNICORN_MAX_WORKERS:-12}"
  GRACE_TIMEOUT="${GUNICORN_GRACEFUL_TIMEOUT:-30}"
  DEFAULT_TIMEOUT="${GUNICORN_DEFAULT_TIMEOUT:-90}"

  # CPU y RAM detectadas
  CPU="$(getconf _NPROCESSORS_ONLN 2>/dev/null || nproc 2>/dev/null || echo 1)"
  MEM_MB="$(awk '/MemTotal/ {printf "%.0f",$2/1024}' /proc/meminfo 2>/dev/null || echo 1024)"

  # ---- WORKERS ----
  ADD_WORKERS=0
  if [ "$FORCE" = "1" ] || ! has_arg "--workers" "$*"; then
    if [ "$WANT_WORKERS" = "auto" ]; then
      BY_CPU=$(( 2 * CPU + 1 ))
      MAX_BY_MEM=$(( MEM_MB / MEM_PER ))
      [ "$MAX_BY_MEM" -lt 1 ] && MAX_BY_MEM=1
      WORKERS="$BY_CPU"
      [ "$MAX_BY_MEM" -lt "$WORKERS" ] && WORKERS="$MAX_BY_MEM"
      [ "$WORKERS" -gt "$MAX_WORKERS" ] && WORKERS="$MAX_WORKERS"
    else
      WORKERS="$WANT_WORKERS"
    fi
    ADD_WORKERS=1
  fi

  # ---- TIMEOUT ----
  ADD_TIMEOUT=0
  if [ "$FORCE" = "1" ] || ! has_arg "--timeout" "$*"; then
    if [ "$WANT_TIMEOUT" = "auto" ]; then
      TIMEOUT="$DEFAULT_TIMEOUT"   # 60–90 es un buen rango; dejamos 90 por seguridad
    else
      TIMEOUT="$WANT_TIMEOUT"
    fi
    ADD_TIMEOUT=1
  fi

  # ---- Ensamble de flags calculados ----
  if [ "$ADD_WORKERS" -eq 1 ]; then
    set -- "$@" --workers "$WORKERS" --worker-class "$WORKER_CLASS"
    log "⚙️ Gunicorn workers auto: CPU=${CPU} MEM=${MEM_MB}MB → workers=${WORKERS} (class=${WORKER_CLASS}, mem/worker≈${MEM_PER}MB, max=${MAX_WORKERS})"
  else
    log "ℹ️ Gunicorn --workers ya especificado y FORCE=$FORCE → se respeta."
  fi

  if [ "$ADD_TIMEOUT" -eq 1 ]; then
    set -- "$@" --timeout "$TIMEOUT" --graceful-timeout "$GRACE_TIMEOUT"
    log "⚙️ Gunicorn timeout: ${TIMEOUT}s (graceful ${GRACE_TIMEOUT}s)"
  else
    log "ℹ️ Gunicorn --timeout ya especificado y FORCE=$FORCE → se respeta."
  fi
fi

# --- Iniciar el servidor (lo que venga como CMD/ENTRYPOINT args) ---
log "🚀 Iniciando: $*"
exec "$@"