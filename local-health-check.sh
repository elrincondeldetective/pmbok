#!/usr/bin/env bash
# local-health-check.sh — Checks rápidos e interactivos para el entorno local con Docker Compose.
#
# USO:
# 1. Guarda este archivo como 'local-health-check.sh' en la raíz de tu proyecto.
# 2. Dale permisos de ejecución: chmod +x local-health-check.sh
# 3. Ejecútalo: ./local-health-check.sh
#
set -Eeuo pipefail

### ====== Configuración Local ======
# Nombre del servicio del backend en tu docker-compose.yml
BACKEND_SERVICE_NAME="backend"

# Puerto local del backend y frontend
BACKEND_PORT="8000"
FRONTEND_PORT="5173"

# Credenciales por defecto para (re)crear el superusuario si aceptas hacerlo
SU_EMAIL="${SU_EMAIL:-admin@admin.com}"
SU_PASSWORD="${SU_PASSWORD:-Neandertal13*}"

### ====== Utilidades ======
ts() { date -Is; }
log() { echo "[$(ts)] $*"; }
CURRENT_SECTION=""
section() {
  local name="$*"
  echo
  echo "========== $name =========="
  echo "[ $(ts) ] >>> BEGIN: $name"
  CURRENT_SECTION="$name"
}
section_end() {
  if [ -n "${CURRENT_SECTION:-}" ]; then
    echo "[ $(ts) ] <<< END  : ${CURRENT_SECTION}"
    CURRENT_SECTION=""
  fi
}
trap 'section_end' EXIT
curl_code() { curl -s -o /dev/null -w "%{http_code}" "$@"; }

# dc: ejecutar un comando DENTRO del contenedor del backend. Usa -T para evitar errores de TTY.
dc() {
  docker compose exec -T "${BACKEND_SERVICE_NAME}" "$@"
}

# confirm: prompt Y/n o y/N según default (y|n).
confirm() {
  local prompt="$1"; local default="${2:-y}"; local yn
  while true; do
    if [ "$default" = "y" ]; then
      read -rp "$prompt [Y/n] " yn
      yn="${yn:-y}"
    else
      read -rp "$prompt [y/N] " yn
      yn="${yn:-n}"
    fi
    case "$yn" in
      [Yy]*) return 0 ;;
      [Nn]*) return 1 ;;
      *) echo "Responde 'y' o 'n'."; ;;
    esac
  done
}

# Ejecutar seeds como función (idempotente si tus comandos lo son)
run_seeds() {
  section "Django: Ejecutando Seeds"
  # ⚠️ Ajusta estos comandos a tus seeds reales; agrega/quita según tu proyecto.
  set +e
  dc python manage.py seed_pmbok || true
  dc python manage.py seed_scrum || true
  dc python manage.py seed_departments || true
  set -e
  section_end
}

SEEDS_RAN=0

### ====== Inicio de Comprobaciones ======

# SECCIÓN: Verifica que los contenedores estén corriendo.
section "Contenedores Activos"
docker compose ps
if ! docker compose ps --services --filter "status=running" | grep -q "^${BACKEND_SERVICE_NAME}$"; then
    log "❌ El contenedor del backend ('${BACKEND_SERVICE_NAME}') no está en ejecución. Abortando."
    exit 1
fi
log "✅ Contenedor del backend '${BACKEND_SERVICE_NAME}' está activo."
section_end

# SECCIÓN: Muestra los logs más recientes de cada servicio.
section "Logs Recientes (últimas 50 líneas)"
log "--- Backend Logs ---"
docker compose logs --tail=50 "${BACKEND_SERVICE_NAME}" || true
log "--- Frontend Logs ---"
docker compose logs --tail=50 "frontend" || true
section_end

# SECCIÓN: Conectividad a la base de datos.
section "Django: Conectividad a la DB"
dc python - <<'PY'
import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE","core.settings"); django.setup()
from django.db import connection, utils
try:
    print("DB HOST:", connection.settings_dict.get("HOST"))
    with connection.cursor() as c:
        c.execute("SELECT 1")
        print("DB OK:", c.fetchone())
except utils.OperationalError as e:
    print("❌ ERROR de conexión a la DB:", e)
PY
section_end

# SECCIÓN: Detección de pendientes de migración (makemigrations y migrate)
NEED_MAKEMIGRATIONS=0
NEED_MIGRATE=0

section "Django: Detección de Migraciones Pendientes"
log "Comprobando si faltan archivos de migración (makemigrations --check --dry-run)..."
if dc python manage.py makemigrations --check --dry-run >/dev/null 2>&1; then
  log "✅ No se detectaron cambios de modelo sin migración."
else
  log "⚠️ Se detectaron cambios de modelo sin migración."
  NEED_MAKEMIGRATIONS=1
fi

log "Comprobando si hay migraciones sin aplicar (migrate --check)..."
if dc python manage.py migrate --check --noinput >/dev/null 2>&1; then
  log "✅ No hay migraciones pendientes por aplicar."
else
  log "⚠️ Hay migraciones pendientes por aplicar."
  NEED_MIGRATE=1
fi
section_end

# SECCIÓN: Ofrecer ejecutar makemigrations/migrate si corresponde
if [ "$NEED_MAKEMIGRATIONS" -eq 1 ]; then
  if confirm "¿Quieres generar los archivos de migración ahora (makemigrations)?" "y"; then
    section "Django: Creando Nuevos Archivos de Migración"
    dc python manage.py makemigrations
    section_end
    # Recalcular necesidad de migrate después de generar migraciones nuevas
    if ! dc python manage.py migrate --check --noinput >/dev/null 2>&1; then
      NEED_MIGRATE=1
    fi
  fi
fi

if [ "$NEED_MIGRATE" -eq 1 ]; then
  if confirm "¿Quieres aplicar las migraciones pendientes (migrate)?" "y"; then
    section "Django: Aplicando Migraciones a la DB"
    dc python manage.py migrate --noinput
    section_end
  fi
fi

# SECCIÓN: Verificar existencia de superusuario
SU_EXISTS="0"
section "Django: Detección de Superusuario"
SU_EXISTS="$(dc python - <<'PY'
import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE","core.settings"); django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
print("1" if User.objects.filter(is_superuser=True).exists() else "0")
PY
)"
if [ "${SU_EXISTS}" = "1" ]; then
  log "ℹ️ Ya existe al menos un superusuario."
  if confirm "¿Quieres (re)crear/forzar un superusuario con email '${SU_EMAIL}' y la contraseña dada?" "n"; then
    section "Django: (Re)Creación de Superusuario"
    dc python manage.py shell <<PY
from django.contrib.auth import get_user_model
User = get_user_model()
email = '${SU_EMAIL}'
password='${SU_PASSWORD}'
u = User.objects.filter(email=email).first()
if u:
    print('Usuario encontrado, actualizando credenciales y permisos...')
    u.set_password(password); u.is_staff=True; u.is_superuser=True; u.save()
    print(f'✔ Actualizado: {email}')
else:
    print('Usuario no encontrado, creando superusuario...')
    User.objects.create_superuser(email=email, password=password)
    print(f'✔ Creado: {email}')
PY
    section_end
  fi
else
  log "ℹ️ No se detectó superusuario."
  if confirm "¿Quieres crear ahora el superusuario '${SU_EMAIL}'?" "y"; then
    section "Django: Creación de Superusuario"
    dc python manage.py createsuperuser --noinput --email "${SU_EMAIL}" || true
    # Asegurar password/permisos por si createsuperuser no soporta --password en tu versión
    dc python manage.py shell <<PY
from django.contrib.auth import get_user_model
User = get_user_model()
email='${SU_EMAIL}'
password='${SU_PASSWORD}'
u = User.objects.filter(email=email).first()
if u:
    u.set_password(password); u.is_staff=True; u.is_superuser=True; u.save()
    print(f'✔ Superusuario preparado: {email}')
else:
    User.objects.create_superuser(email=email, password=password)
    print(f'✔ Superusuario creado: {email}')
PY
    section_end
  fi
fi
section_end

# SECCIÓN: Conteo rápido de modelos para inferir si la DB está "poblada"
DB_POPULATED="0"
APP_API_STATUS="ok"
section "Django: Conteo de Modelos en app 'api' (para inferir si hay datos)"
DB_POPULATED="$(dc python - <<'PY'
import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE","core.settings"); django.setup()
from django.apps import apps
try:
    app = apps.get_app_config("api")
    populated = 0
    print("Contando filas de los modelos de la app 'api':")
    for m in app.get_models():
        try:
            c = m.objects.count()
            print(f"- {m.__name__}: {c} filas")
            if c > 0:
                populated += 1
        except Exception as e:
            print(f"- {m.__name__}: error -> {e}")
    print("POBLADA=1" if populated>0 else "POBLADA=0")
except LookupError:
    print("App 'api' no encontrada.")
    print("POBLADA=0")
PY
 | awk -F= '/^POBLADA=/ {print $2}' )"
if [ "${DB_POPULATED}" = "1" ]; then
  log "ℹ️ La base de datos parece estar poblada (al menos una tabla de 'api' tiene filas)."
  if confirm "¿Quieres repoblarla de todas formas (puede duplicar datos si tus seeds no son idempotentes)?" "n"; then
    run_seeds
    SEEDS_RAN=1
  fi
else
  log "ℹ️ La base de datos parece vacía para la app 'api'."
  if confirm "¿Quieres poblarla ahora ejecutando los seeds?" "y"; then
    run_seeds
    SEEDS_RAN=1
  fi
fi
section_end

# SECCIÓN: Aun sin cambios de migración, ofrecer repoblar DB
if [ "$NEED_MAKEMIGRATIONS" -eq 0 ] && [ "$NEED_MIGRATE" -eq 0 ] && [ "$SEEDS_RAN" -eq 0 ]; then
  if confirm "No hay cambios de migración. ¿Quieres repoblar la base de datos de todas formas?" "n"; then
    run_seeds
    SEEDS_RAN=1
  fi
fi

# SECCIÓN: Verificación de endpoints locales.
section "Verificación de Endpoints Locales"
log "Comprobando Backend en http://localhost:${BACKEND_PORT}..."
code_health=$(curl_code "http://localhost:${BACKEND_PORT}/healthz" || true)
code_version=$(curl_code "http://localhost:${BACKEND_PORT}/version" || true)
echo "  - /healthz → esperado 200 | obtenido: ${code_health:-ERR}"
echo "  - /version → esperado 200 | obtenido: ${code_version:-ERR}"

log "Comprobando Frontend en http://localhost:${FRONTEND_PORT}..."
code_frontend=$(curl_code "http://localhost:${FRONTEND_PORT}" || true)
echo "  - / (Frontend) → esperado 200 | obtenido: ${code_frontend:-ERR}"
section_end

log "✅ Script finalizado."
