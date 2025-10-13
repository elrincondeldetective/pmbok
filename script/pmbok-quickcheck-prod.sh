──── ./script/pmbok-quickcheck-prod.sh ────
docker compose down -v                                                              
docker compose build backend 
docker compose up -d backend
docker compose logs -f backend | sed -n '1,120p'
curl -s http://127.0.0.1/version

docker compose down && docker compose up --build

# Detener y Eliminar Todo (Incluida la Base de Datos)
docker compose down -v

docker compose run --rm backend python manage.py makemigrations --empty api
docker compose run --rm backend python manage.py makemigrations api
# Este es el comando clave. Usaremos el flag --entrypoint "" para decirle a Docker que ignore el entrypoint.sh solo para esta ejecución.
docker compose run --rm --entrypoint "" backend python manage.py makemigrations api
docker compose run --rm --entrypoint "" backend python manage.py makemigrations api

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


# Local
docker compose exec -T backend python manage.py shell <<'PY'
from django.contrib.auth import get_user_model

User = get_user_model()
email = 'admin@admin.com'
password = 'Neandertal13*'

if User.objects.filter(email=email).exists():
    print('Usuario ya existe, actualizando...')
    u = User.objects.get(email=email)
    u.set_password(password)
    u.is_staff = True
    u.is_superuser = True
    u.save()
    print('✔ Contraseña y permisos de administrador actualizados para', email)
else:
    print('Usuario no encontrado, creando uno nuevo...')
    # La línea clave que se corrigió: se eliminó el argumento 'username'
    User.objects.create_superuser(email=email, password=password)
    print('✔ Superusuario', email, 'creado correctamente.')
PY     

# Prod
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
# pmbok-quickcheck-prod.sh — Checks rápidos para EB + Docker + Django
# Úsalo dentro de la instancia EC2 (SSH).
# nano pmbok-quickcheck.sh
# chmod +x pmbok-quickcheck.sh
# ./pmbok-quickcheck.sh
set -Eeuo pipefail

# ------------------------------------------------------------------------------------
# NOTA SOBRE MARCAS DE SECCIONES EN SALIDA (BEGIN/END)
# ------------------------------------------------------------------------------------
# - Se imprime un encabezado visible de sección "========== <NOMBRE> ==========" y además:
#     [YYYY-MM-DDTHH:MM:SS+00:00] >>> BEGIN: <NOMBRE>
#     [YYYY-MM-DDTHH:MM:SS+00:00] <<< END  : <NOMBRE>
# - Cada 'section' abre una sección; añadimos 'section_end' justo antes de cada nueva
#   'section' para cerrar la anterior. Al terminar el script, un trap EXIT cierra
#   cualquier sección abierta restante automáticamente.
# - Hay un caso particular: "Últimos logs del contenedor" imprime su encabezado
#   al inicio, pero el contenido (tail 200) se muestra después de los bloques
#   de Gunicorn. Para que sea claro, alrededor de ese 'tail' también añadimos
#   marcas BEGIN/END explícitas (contenido diferido).
# ------------------------------------------------------------------------------------

### ====== Config rápida (ajusta si lo necesitas) ======
# Hostname público de tu ambiente EB (para las pruebas por Nginx con Host:)
EB_HOST="pmbok-app-prod.eba-p9tjqp8p.us-east-1.elasticbeanstalk.com"

# IP privada de la instancia (para simular el Host que envía el ALB).
# 1) Intenta IMDS; 2) hostname -I; 3) salida de 'ip route get'.
PRIVATE_IP="${PRIVATE_IP:-$(curl -s --max-time 1 http://169.254.169.254/latest/meta-data/local-ipv4 || true)}"
if [ -z "$PRIVATE_IP" ]; then
  # Fallbacks si IMDS no responde
  PRIVATE_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
fi
if [ -z "$PRIVATE_IP" ] && command -v ip >/dev/null 2>&1; then
  PRIVATE_IP="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}')"
fi

# Dominio público de la API (HTTPS) para validar /healthz, /version y endpoints.
API_DOMAIN="${API_DOMAIN:-api.elrincondeldetective.com}"

# Dominio del frontend (para probar rechazo 444 en backend por Host inválido).
FRONTEND_DOMAIN="${FRONTEND_DOMAIN:-elrincondeldetective.com}"

# Dirección del ALB o IP pública para la prueba 444 (si no la pones, se salta esa prueba).
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
# ts: timestamp ISO-8601 (útil para marcar BEGIN/END).
ts() { date -Is; }

# log: imprime con timestamp.
log() { echo "[$(ts)] $*"; }

# section: imprime encabezado visible y marca BEGIN; guarda el nombre activo.
CURRENT_SECTION=""
section() {
  local name="$*"
  echo
  echo "========== $name =========="
  echo "[ $(ts) ] >>> BEGIN: $name"
  CURRENT_SECTION="$name"
}

# section_end: marca el fin de la sección activa (si la hay).
section_end() {
  if [ -n "${CURRENT_SECTION:-}" ]; then
    echo "[ $(ts) ] <<< END  : ${CURRENT_SECTION}"
    CURRENT_SECTION=""
  fi
}

# Cierra automáticamente la última sección si el script termina con una abierta.
trap 'section_end' EXIT

# exists: ¿existe un binario?
exists() { command -v "$1" >/dev/null 2>&1; }

# mask: enmascara valores si SHOW_SECRETS=0 (por ejemplo, SECRET_KEY).
mask() {
  local s="$1"
  [ "$SHOW_SECRETS" = "1" ] && { echo "$s"; return; }
  local n=${#s}
  if (( n <= 6 )); then echo "***"; else echo "${s:0:3}****${s: -2}"; fi
}

# curl_code: curl que devuelve sólo el status code (útil para checks rápidos).
curl_code() { curl -s -o /dev/null -w "%{http_code}" "$@"; }

# detect_cid: detecta el contenedor de la app (prefiere imagen aws_beanstalk/current-app).
detect_cid() {
  local cid
  cid=$(sudo docker ps -q --filter "ancestor=aws_beanstalk/current-app" || true)
  if [ -z "$cid" ]; then
    cid=$(sudo docker ps -q | head -n1 || true)
  fi
  echo "$cid"
}

# dc: ejecutar un comando dentro del contenedor TARGET ($CID) usando sh -lc.
#     Útil para invocar manage.py, Python embebido, o inspecciones internas.
dc() {
  local cmd="$*"
  sudo docker exec -i "$CID" sh -lc "$cmd"
}

### ====== Inicio ======
# SECCIÓN: lista contenedores y verifica que haya uno activo para continuar.
section "Contenedores activos"
sudo docker ps --format 'table {{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.Names}}' || true

CID="$(detect_cid)"
if [ -z "$CID" ]; then
  log "❌ No hay contenedores en ejecución. Revisa EB/Despliegue."
  exit 1
fi
log "Usando contenedor: $CID"
section_end

# SECCIÓN: (cabecera) “Últimos logs del contenedor”.
# NOTA: el contenido real (tail 200) se imprime **más adelante** tras los checks de Gunicorn.
section "Últimos logs del contenedor"
section_end

# SECCIÓN: inspección de auto-tuning de Gunicorn (flags, workers, timeout) desde /proc.
# - Lee variables GUNICORN_ de entorno
# - Parsea el comando maestro desde /proc/1/cmdline
# - Cuenta workers vivos como hijos del PID 1
# - Calcula workers/timeout esperados replicando la fórmula del entrypoint
# - Compara valores actuales vs esperados
section "Gunicorn auto-tune (workers/timeout)"
# 1) Estado real dentro del contenedor (flags y procesos)
dc 'set -e
echo "— ENV GUNICORN_* relevantes —"
env | grep -E "^GUNICORN_(FORCE_AUTOTUNE|AUTOTUNE|WORKERS|TIMEOUT|WORKER_CLASS|MAX_WORKERS|DEFAULT_TIMEOUT|GRACEFUL_TIMEOUT|MEM_PER_WORKER_MB)" || true
echo

# Master CMD sin pgrep/ps: lee /proc/1/cmdline
PG=""
if [ -r /proc/1/cmdline ]; then
  PG="$(tr "\0" " " </proc/1/cmdline)"
fi
echo "Master CMD: ${PG:-<no encontrado>}"
if [ -n "$PG" ]; then
  ACT_WORKERS="$(printf "%s" "$PG" | sed -nE "s/.*--workers[ =]([0-9]+).*/\1/p")"
  ACT_TIMEOUT="$(printf "%s" "$PG" | sed -nE "s/.*--timeout[ =]([0-9]+).*/\1/p")"
  ACT_WCLASS="$(printf "%s" "$PG" | sed -nE "s/.*--worker-class[ =]([^ ]+).*/\1/p")"

  # Workers vivos = hijos directos del master (PID 1)
  CHILDREN="$(cat /proc/1/task/1/children 2>/dev/null || true)"
  if [ -n "$CHILDREN" ]; then
    WCOUNT="$(printf "%s\n" "$CHILDREN" | awk "{print NF}")"
  else
    WCOUNT="0"
  fi
  echo "Actual flags : workers=${ACT_WORKERS:-<no-flag>} timeout=${ACT_TIMEOUT:-<no-flag>} class=${ACT_WCLASS:-<no-flag>}"
  echo "Workers vivos: ${WCOUNT}"
  echo

  # 2) Cálculo esperado (misma fórmula del entrypoint)
  CPU="$(getconf _NPROCESSORS_ONLN 2>/dev/null || nproc 2>/dev/null || echo 1)"
  MEM_MB="$(awk '\''/MemTotal/ {printf "%.0f",$2/1024}'\'' /proc/meminfo 2>/dev/null || echo 1024)"
  MEM_PER="${MEM_PER_WORKER_MB:-180}"
  MAX_WORKERS="${GUNICORN_MAX_WORKERS:-12}"
  WANT_WORKERS="${GUNICORN_WORKERS:-auto}"
  DEFAULT_TIMEOUT="${GUNICORN_DEFAULT_TIMEOUT:-90}"
  WANT_TIMEOUT="${GUNICORN_TIMEOUT:-auto}"

  if [ "$WANT_WORKERS" = "auto" ]; then
    BY_CPU=$(( 2 * CPU + 1 ))
    MAX_BY_MEM=$(( MEM_MB / MEM_PER ))
    [ "$MAX_BY_MEM" -lt 1 ] && MAX_BY_MEM=1
    EXP_WORKERS="$BY_CPU"
    [ "$MAX_BY_MEM" -lt "$EXP_WORKERS" ] && EXP_WORKERS="$MAX_BY_MEM"
    [ "$EXP_WORKERS" -gt "$MAX_WORKERS" ] && EXP_WORKERS="$MAX_WORKERS"
  else
    EXP_WORKERS="$WANT_WORKERS"
  fi

  if [ "$WANT_TIMEOUT" = "auto" ]; then
    EXP_TIMEOUT="$DEFAULT_TIMEOUT"
  else
    EXP_TIMEOUT="$WANT_TIMEOUT"
  fi

  echo "Esperado     : workers=${EXP_WORKERS} timeout=${EXP_TIMEOUT}s (CPU=${CPU}, MEM=${MEM_MB}MB, mem/worker≈${MEM_PER}MB, max=${MAX_WORKERS})"

  # 3) Comparación simple
  if [ -n "$ACT_WORKERS" ] && [ -n "$ACT_TIMEOUT" ]; then
    if [ "$ACT_WORKERS" -eq "$EXP_WORKERS" ] && [ "$ACT_TIMEOUT" -eq "$EXP_TIMEOUT" ]; then
      echo "[OK] Gunicorn coincide con el auto-tune esperado."
    else
      echo "[WARN] Gunicorn difiere: got workers=$ACT_WORKERS timeout=$ACT_TIMEOUT; expected workers=$EXP_WORKERS timeout=$EXP_TIMEOUT"
    fi
  else
    echo "[INFO] Flags --workers/--timeout no visibles en el CMD del master."
    echo "       (Puede que vengan fijados en el Docker CMD y no se forzó auto-tune; revisa logs.)"
  fi
fi
'
section_end

# SECCIÓN: evidencia del entrypoint sobre auto-tune en los logs (desde el arranque del contenedor).
section "Gunicorn auto-tune: logs recientes del contenedor"
SINCE="$(sudo docker inspect -f "{{.State.StartedAt}}" "$CID" 2>/dev/null || true)"
if [ -n "$SINCE" ]; then
  sudo docker logs --since "$SINCE" "$CID" 2>&1 | grep -E "Gunicorn (workers auto|timeout|--workers ya especificado|--timeout ya especificado|⚙️)" || echo "No se hallaron mensajes de auto-tune desde el arranque."
else
  sudo docker logs "$CID" 2>&1 | grep -E "Gunicorn (workers auto|timeout|--workers ya especificado|--timeout ya especificado|⚙️)" || echo "No se hallaron mensajes recientes de auto-tune."
fi
section_end

# CONTENIDO DIFERIDO de “Últimos logs del contenedor”.
# Aquí sí se imprime el tail 200, con marcas BEGIN/END explícitas para esa sección.
echo "[ $(ts) ] >>> BEGIN: Últimos logs del contenedor (tail 200)"
sudo docker logs --tail 200 "$CID" || true
echo "[ $(ts) ] <<< END  : Últimos logs del contenedor"

### EB / Nginx / SELinux
# SECCIÓN: logs de EB (motor y hooks), útiles para entender el ciclo de despliegue.
section "Logs de Elastic Beanstalk (engine/hooks)"
sudo tail -n 150 /var/log/eb-engine.log || true
sudo tail -n 100 /var/log/eb-hooks.log || true
section_end

# SECCIÓN: últimos errores y accesos de Nginx (para rechazos 444, upstreams, etc.).
section "Logs de Nginx"
sudo tail -n 60 /var/log/nginx/error.log || true
sudo tail -n 60 /var/log/nginx/access.log || true
section_end

# SECCIÓN: estado de SELinux, booleanos y puertos http_port_t (si aplica a la AMI).
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
section_end

### Django / App
# SECCIÓN: plan de migraciones (que haría migrate sin aplicar cambios).
section "Django: migraciones (plan)"
dc 'python manage.py migrate --plan || true'
section_end

# SECCIÓN: muestra un corte de los migrations aplicados (primeros 100).
section "Django: mostrar primeros migrations aplicados"
dc 'python manage.py showmigrations | sed -n "1,100p" || true'
section_end

# SECCIÓN: imprime STATIC_ROOT y lista los primeros items recolectados.
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
section_end

# SECCIÓN: conectividad básica a la DB (host y SELECT 1).
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
section_end

# SECCIÓN: conteo rápido de filas por modelo en la app 'api' (para sanity check de datos).
section "Django: conteo rápido de modelos en app '\''api'\'''"
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
    print("App '\''api'\'' no encontrada en INSTALLED_APPS")
PY
' || true
section_end

# SECCIÓN (opcional): ejecución de seeds con verbosity 2.
if [ "$RUN_SEED" = "1" ]; then
  section "Django: ejecutando seeds (-v 2)"
  dc "python manage.py seed_pmbok -v 2" || true
  dc "python manage.py seed_scrum -v 2" || true
  dc "python manage.py seed_departments -v 2" || true
  section_end
fi

### Variables de entorno del despliegue
# SECCIÓN: muestra env.list de EB, enmascarando valores sensibles.
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
section_end

# Determinar ruta del admin desde env.list (o usar default).
# ADMIN_URL puede venir de EB; si no, usamos 'super-admin/'.
ADMIN_URL="${ADMIN_URL:-$(grep -E '^DJANGO_ADMIN_URL=' /opt/elasticbeanstalk/deployment/env.list 2>/dev/null | cut -d= -f2 || echo 'super-admin/')}"
[[ "$ADMIN_URL" != */ ]] && ADMIN_URL="${ADMIN_URL}/"
ADMIN_LOGIN_PATH="${ADMIN_URL%/}/login/"

### Mini check-list de verificación (local Nginx → Gunicorn)
# SECCIÓN: pruebas HTTP locales contra Nginx (que hace de reverse proxy hacia el contenedor).
# - Verifica /healthz sin Host (200)
# - Rechazo 444 con Host inválido (curl reporta 000, pero Nginx log muestra 444)
# - /healthz con Host=EB_HOST (200)
# - /healthz con Host=IP privada (simula ALB) (200)
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

# Cabeceras mínimas para comprobar redirecciones/seguridad.
echo
echo "Cabeceras (HEAD) locales por Nginx:"
curl -s -I -H "Host: $EB_HOST" http://127.0.0.1/ | sed -n '1,8p' || true
curl -s -I -H "Host: $EB_HOST" http://127.0.0.1/admin/login/ | sed -n '1,8p' || true
section_end

### Verificación pública (HTTPS hacia API_DOMAIN)
# SECCIÓN: valida el backend públicamente por HTTPS (healthz, version, admin login y 401 en API).
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
section_end

### Comprobar que el backend NO responde con host del frontend (esperado 444)
# SECCIÓN: si se define ALB_ADDR, intenta llegar al backend vía ALB con Host=frontend (espera 444).
if [ -n "$ALB_ADDR" ]; then
  section "Rechazo por Host del frontend en ALB/IP (esperado 444)"
  echo "# Comprobar que el BACKEND NO responde con host del frontend"
  echo "# Probando: curl -I -H 'Host: ${FRONTEND_DOMAIN}' http://${ALB_ADDR}:80/healthz"
  curl -I -H "Host: ${FRONTEND_DOMAIN}" "http://${ALB_ADDR}:80/healthz" || true
  section_end
else
  section "Rechazo por Host del frontend — saltado"
  echo "Define ALB_ADDR (DNS del ALB o IP pública válida) para ejecutar esta prueba."
  section_end
fi

# SECCIÓN (opcional): prueba adicional vía ALB simulando Host=IP privada (espera 200).
if [ -n "$ALB_ADDR" ] && [ -n "$PRIVATE_IP" ]; then
  section "ALB: /healthz con Host=IP_privada (esperado 200)"
  echo "# Probando: curl -I -H 'Host: ${PRIVATE_IP}' http://${ALB_ADDR}:80/healthz"
  curl -I -H "Host: ${PRIVATE_IP}" "http://${ALB_ADDR}:80/healthz" || true
  section_end
fi

### Seguir logs (opcional)
# SECCIÓN (opcional): sigue logs del contenedor en vivo (Ctrl+C para salir).
if [ "$FOLLOW_LOGS" = "1" ]; then
  section "Siguiendo logs del contenedor (Ctrl+C para salir)"
  sudo docker logs -f --since 5m "$CID"
  section_end
fi

log "✅ Listo."
######################################
chmod +x pmbok-quickcheck-prod.sh
./pmbok-quickcheck-prod.sh


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
