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

# 4) Contenedor (app)
CID=$(docker ps --format '{{.ID}} {{.Image}} {{.Names}}')

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




#############################
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

# IP privada de la instancia (para simular el Host que envía el ALB)
PRIVATE_IP="${PRIVATE_IP:-$(curl -s --max-time 1 http://169.254.169.254/latest/meta-data/local-ipv4 || true)}"
if [ -z "$PRIVATE_IP" ]; then
  # Fallbacks si IMDS no responde
  PRIVATE_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
fi
if [ -z "$PRIVATE_IP" ] && command -v ip >/dev/null 2>&1; then
  PRIVATE_IP="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}')"
fi

# Dominio público de la API (HTTPS)
API_DOMAIN="${API_DOMAIN:-api.elrincondeldetective.com}"

# Dominio del frontend (para probar rechazo 444 en backend)
FRONTEND_DOMAIN="${FRONTEND_DOMAIN:-elrincondeldetective.com}"

# Dirección del ALB o IP pública para la prueba 444 (si no la pones, se salta esa prueba)
ALB_ADDR="${ALB_ADDR:-}"

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
# Curl que devuelve sólo el status code
curl_code() { curl -s -o /dev/null -w "%{http_code}" "$@"; }

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

# Determinar ruta del admin desde env.list (o usar default)
ADMIN_URL="${ADMIN_URL:-$(grep -E '^DJANGO_ADMIN_URL=' /opt/elasticbeanstalk/deployment/env.list 2>/dev/null | cut -d= -f2 || echo 'super-admin/')}"
[[ "$ADMIN_URL" != */ ]] && ADMIN_URL="${ADMIN_URL}/"
ADMIN_LOGIN_PATH="${ADMIN_URL%/}/login/"

### Mini check-list de verificación (local Nginx → Gunicorn)
section "Mini check-list (local Nginx → Gunicorn)"
code1=$(curl_code http://127.0.0.1/healthz || true)
echo "1) /healthz local (sin Host) → esperado 200 | obtenido: $code1"

code2=$(curl_code -H 'Host: bad.example' http://127.0.0.1/ || true)
echo "2) Host inválido en / → esperado 444 | obtenido: $code2"

code3=$(curl_code -H "Host: $EB_HOST" http://127.0.0.1/healthz || true)
echo "3) /healthz con Host=$EB_HOST → esperado 200 | obtenido: $code3"

# 4) Simular ALB: /healthz con Host=IP privada de la instancia
if [ -n "$PRIVATE_IP" ]; then
  code4=$(curl_code -H "Host: ${PRIVATE_IP}" http://127.0.0.1/healthz || true)
  echo "4) /healthz con Host=IP_privada (${PRIVATE_IP}) → esperado 200 | obtenido: $code4"
else
  echo "4) /healthz con Host=IP_privada → saltado (no se pudo determinar PRIVATE_IP)"
fi

# También algo de inspección rápida
echo
echo "Cabeceras (HEAD) locales por Nginx:"
curl -s -I -H "Host: $EB_HOST" http://127.0.0.1/ | sed -n '1,8p' || true
curl -s -I -H "Host: $EB_HOST" http://127.0.0.1/admin/login/ | sed -n '1,8p' || true

### Verificación pública (HTTPS hacia API_DOMAIN)
section "Verificación pública (HTTPS hacia $API_DOMAIN)"
echo "# Backend OK por HTTPS"
curl -I "https://${API_DOMAIN}/healthz" || true
curl -I "https://${API_DOMAIN}/version" || true

echo
echo "# Admin (usa la ruta configurada; default super-admin/)"
curl -I -L "https://${API_DOMAIN}/${ADMIN_LOGIN_PATH#\/}" || true

echo
echo "# API debe responder 401 sin token (correcto)"
curl -I "https://${API_DOMAIN}/api/tasks/" || true

### Comprobar que el backend NO responde con host del frontend (esperado 444)
if [ -n "$ALB_ADDR" ]; then
  section "Rechazo por Host del frontend en ALB/IP (esperado 444)"
  echo "# Comprobar que el BACKEND NO responde con host del frontend"
  echo "# Probando: curl -I -H 'Host: ${FRONTEND_DOMAIN}' http://${ALB_ADDR}:80/healthz"
  curl -I -H "Host: ${FRONTEND_DOMAIN}" "http://${ALB_ADDR}:80/healthz" || true
else
  section "Rechazo por Host del frontend — saltado"
  echo "Define ALB_ADDR (DNS del ALB o IP pública válida) para ejecutar esta prueba."
fi

# (Opcional) Validación a través del ALB real usando Host=IP privada
if [ -n "$ALB_ADDR" ] && [ -n "$PRIVATE_IP" ]; then
  section "ALB: /healthz con Host=IP_privada (esperado 200)"
  echo "# Probando: curl -I -H 'Host: ${PRIVATE_IP}' http://${ALB_ADDR}:80/healthz"
  curl -I -H "Host: ${PRIVATE_IP}" "http://${ALB_ADDR}:80/healthz" || true
fi


### Seguir logs (opcional)
if [ "$FOLLOW_LOGS" = "1" ]; then
  section "Siguiendo logs del contenedor (Ctrl+C para salir)"
  sudo docker logs -f --since 5m "$CID"
fi

log "✅ Listo."
######################################
chmod +x pmbok-quickcheck.sh


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
