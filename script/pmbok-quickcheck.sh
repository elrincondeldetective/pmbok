docker compose down -v                                                              
docker compose build backend 
docker compose up -d backend
docker compose logs -f backend | sed -n '1,120p'
curl -s http://127.0.0.1/version


CID=$(sudo docker ps -q)

sudo docker logs --tail 200 $CID


# 1) Logs del motor de despliegue y hooks de EB
sudo tail -n 200 /var/log/eb-engine.log
sudo tail -n 200 /var/log/eb-hooks.log

# 2) Tus hooks personalizados (.platform/hooks)
sudo tail -n 200 /var/log/selinux-nginx-upstream.log  # predeploy
sudo tail -n 200 /var/log/selinux-smoke.log           # postdeploy (smoke test)

# 3) Nginx y salud
sudo tail -n 200 /var/log/nginx/error.log
sudo tail -n 200 /var/log/healthd/daemon.log

# 4) Contenedor (app)
CID=$(sudo docker ps -q)

sudo docker logs --tail 200 $CID



# 3) Confirma que se ejecutó
# ver el resultado del hook
sudo tail -n 200 /var/log/selinux-smoke.log

# si llega a marcar [error], pega también:
CID=$(sudo docker ps -q)
sudo docker logs --tail 200 $CID

# Después de desplegar con tu pipeline:

# Conéctate por SSH y revisa logs de hooks:

sudo tail -n 200 /var/log/eb-hooks.log
sudo tail -n 200 /var/log/selinux-nginx-upstream.log
sudo tail -n 200 /var/log/selinux-smoke.log   # si creaste el postdeploy

# Verifica los cambios de SELinux:
getenforce
getsebool httpd_can_network_connect
sudo semanage port -l | grep -E '^http_port_t\b' | grep -w 8000

# Prueba local en la instancia (como hiciste):

curl -s -I -H "Host: pmbok-app-prod.eba-p9tjqp8p.us-east-1.elasticbeanstalk.com" \
     http://127.0.0.1/admin/login/ | head -n1


# Resetear la contraseña del admin existente (recomendado)
CID=$(sudo docker ps -q | head -n1)

sudo docker exec -i "$CID" python manage.py shell <<'PY'
from django.contrib.auth import get_user_model
User = get_user_model()
u = User.objects.get(email='admin@admin.com')
u.set_password('Neandertal13*')
u.is_staff = True
u.is_superuser = True
u.save()
print("✔ Password reseteado y flags de admin asegurados")
PY

# Crear otro superusuario con otro correo
CID=$(sudo docker ps -q | head -n1)

sudo docker exec \
  -e DJANGO_SUPERUSER_USERNAME='admin2' \
  -e DJANGO_SUPERUSER_EMAIL='admin2@admin.com' \
  -e DJANGO_SUPERUSER_PASSWORD='Neandertal13*' \
  -it "$CID" python manage.py createsuperuser --noinput




#!/usr/bin/env bash
# pmbok-quickcheck.sh — Checks rápidos para EB + Docker + Django
# Úsalo dentro de la instancia EC2 (SSH).
# nano pmbok-quickcheck.sh
# chmod +x pmbok-quickcheck.sh
# ./pmbok-quickcheck.sh
set -Eeuo pipefail

### ====== Config rápida (ajusta si lo necesitas) ======
# Hostname público de tu ambiente EB (para las pruebas por Nginx con Host:)
EB_HOST="pmbok-app-prod.eba-p9tjqp8p.us-east-1.elasticbeanstalk.com"

# Mostrar secretos? (0 = enmascarar, 1 = mostrar tal cual)
SHOW_SECRETS="${SHOW_SECRETS:-0}"

# Opcional: crear/actualizar superusuario automáticamente
CREATE_SU="${CREATE_SU:-0}"
SU_USERNAME="${SU_USERNAME:-admin}"
SU_EMAIL="${SU_EMAIL:-admin@admin.com}"
SU_PASSWORD="${SU_PASSWORD:-Neandertal13*}"

# Opcional: ejecutar seeds (0/1)
RUN_SEED="${RUN_SEED:-0}"

# Seguir logs del contenedor al final (0/1)
FOLLOW_LOGS="${FOLLOW_LOGS:-0}"

### ====== Utilidades ======
ts() { date -Is; }
log() { echo "[$(ts)] $*"; }
section() { echo; echo "========== $* =========="; }
exists() { command -v "$1" >/dev/null 2>&1; }
mask() {
  local s="$1"
  [ "$SHOW_SECRETS" = "1" ] && { echo "$s"; return; }
  local n=${#s}
  if (( n <= 6 )); then echo "***"; else echo "${s:0:3}****${s: -2}"; fi
}

# Detecta contenedor de la app
detect_cid() {
  local cid
  cid=$(sudo docker ps -q --filter "ancestor=aws_beanstalk/current-app" || true)
  if [ -z "$cid" ]; then
    cid=$(sudo docker ps -q | head -n1 || true)
  fi
  echo "$cid"
}

# Ejecutar dentro del contenedor
dc() {
  local cmd="$*"
  sudo docker exec -i "$CID" sh -lc "$cmd"
}

### ====== Inicio ======
section "Contenedores activos"
sudo docker ps --format 'table {{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.Names}}' || true

CID="$(detect_cid)"
if [ -z "$CID" ]; then
  log "❌ No hay contenedores en ejecución. Revisa EB/Despliegue."
  exit 1
fi
log "Usando contenedor: $CID"

section "Últimos logs del contenedor"
sudo docker logs --tail 200 "$CID" || true

### EB / Nginx / SELinux
section "Logs de Elastic Beanstalk (engine/hooks)"
sudo tail -n 150 /var/log/eb-engine.log || true
sudo tail -n 100 /var/log/eb-hooks.log || true

section "Logs de Nginx"
sudo tail -n 60 /var/log/nginx/error.log || true
sudo tail -n 60 /var/log/nginx/access.log || true

section "Estado SELinux (si aplica)"
if exists getenforce; then
  getenforce || true
  exists getsebool && getsebool httpd_can_network_connect || true
  if exists semanage; then
    sudo semanage port -l | grep -E '^http_port_t\b' | grep -w 8000 || true
  else
    log "semanage no disponible (policycoreutils-python-utils no instalado)."
  fi
else
  log "SELinux tools no disponibles en esta AMI (normal en varios AMI/EB)."
fi

### Django / App
section "Django: migraciones (plan)"
dc 'python manage.py migrate --plan || true'

section "Django: mostrar primeros migrations aplicados"
dc 'python manage.py showmigrations | sed -n "1,100p" || true'

section "Django: STATIC_ROOT y archivos recolectados"
dc 'python - <<PY
import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE","core.settings"); django.setup()
from django.conf import settings
print("STATIC_ROOT =", settings.STATIC_ROOT)
if settings.STATIC_ROOT and os.path.isdir(settings.STATIC_ROOT):
    for i, name in enumerate(sorted(os.listdir(settings.STATIC_ROOT))[:10], 1):
        print(f"  [{i}] {name}")
PY
' || true

section "Django: conectividad a la DB"
dc 'python - <<PY
import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE","core.settings"); django.setup()
from django.db import connection
print("DB HOST:", connection.settings_dict.get("HOST"))
with connection.cursor() as c:
    c.execute("SELECT 1")
    print("DB OK:", c.fetchone())
PY
' || true

section "Django: conteo rápido de modelos en app 'api'"
dc 'python - <<PY
import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE","core.settings"); django.setup()
from django.apps import apps
try:
    app = apps.get_app_config("api")
    for m in app.get_models():
        try:
            print(f"{m.__name__}: {m.objects.count()} filas")
        except Exception as e:
            print(f"{m.__name__}: error -> {e}")
except LookupError:
    print("App 'api' no encontrada en INSTALLED_APPS")
PY
' || true

if [ "$RUN_SEED" = "1" ]; then
  section "Django: ejecutando seeds (-v 2)"
  dc "python manage.py seed_pmbok -v 2" || true
  dc "python manage.py seed_scrum -v 2" || true
  dc "python manage.py seed_departments -v 2" || true
fi

### Variables de entorno del despliegue
section "Variables de entorno de EB (enmascaradas)"
if [ -f /opt/elasticbeanstalk/deployment/env.list ]; then
  while IFS='=' read -r k v; do
    case "$k" in
      DB_PASSWORD|SECRET_KEY|AWS_SECRET_ACCESS_KEY|DJANGO_SECRET_KEY)
        echo "$k=$(mask "$v")"
        ;;
      *)
        echo "$k=$v"
        ;;
    esac
  done < /opt/elasticbeanstalk/deployment/env.list
else
  log "No existe /opt/elasticbeanstalk/deployment/env.list"
fi

### Pruebas HTTP internas vía Nginx
section "Curl por Nginx local (con Host: $EB_HOST)"
curl -s -I -H "Host: $EB_HOST" http://127.0.0.1/ | sed -n '1,8p' || true
curl -s -I -H "Host: $EB_HOST" http://127.0.0.1/admin/login/ | sed -n '1,8p' || true

### Crear/actualizar superusuario (opcional)
if [ "$CREATE_SU" = "1" ]; then
  section "Crear/actualizar superusuario"
  sudo docker exec \
    -e SU_NAME="$SU_USERNAME" \
    -e SU_EMAIL="$SU_EMAIL" \
    -e SU_PASSWORD="$SU_PASSWORD" \
    -it "$CID" sh -lc '
python - <<PY
import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE","core.settings"); django.setup()
from django.contrib.auth import get_user_model
U = get_user_model()
username_field = U.USERNAME_FIELD
identifier = os.environ.get("SU_NAME") or os.environ.get("SU_EMAIL")
if not identifier:
    raise SystemExit("Faltan SU_NAME/SU_EMAIL")
defaults = {"email": os.environ.get("SU_EMAIL", identifier), "is_staff": True, "is_superuser": True}
obj, created = U.objects.get_or_create(**{username_field: identifier}, defaults=defaults)
pwd = os.environ.get("SU_PASSWORD")
if pwd:
    obj.set_password(pwd)
    obj.save()
print(("Creado" if created else "Actualizado"), f"{username_field}={identifier}")
PY
' || true
fi

### Seguir logs (opcional)
if [ "$FOLLOW_LOGS" = "1" ]; then
  section "Siguiendo logs del contenedor (Ctrl+C para salir)"
  sudo docker logs -f --since 5m "$CID"
fi

log "✅ Listo."
