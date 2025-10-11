#!/usr/bin/env sh
# backend/entrypoint.sh
set -e

# --- Obtener IP privada de la instancia y exportarla como variable de entorno ---
EC2_PRIVATE_IP=$(wget -q -O - http://169.254.169.254/latest/meta-data/local-ipv4)
export EC2_PRIVATE_IP
log "IP Privada de la instancia: $EC2_PRIVATE_IP"

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

# --- Iniciar el servidor (lo que venga como CMD/ENTRYPOINT args) ---
log "🚀 Iniciando: $*"
exec "$@"
