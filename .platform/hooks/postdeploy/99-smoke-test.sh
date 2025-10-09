#!/usr/bin/env bash          # Usa bash para ejecutar el script (shebang).

# .platform/hooks/postdeploy/99-smoke-test.sh
set -Eeuo pipefail            # Endurece el shell:
                             #  -e  : si un comando falla, termina el script.
                             #  -E  : propaga traps de ERR a funciones/subshells.
                             #  -u  : usar var no definida es error.
                             #  pipefail: un pipe falla si falla cualquiera de sus comandos.

LOG="/var/log/selinux-smoke.log"     # Archivo donde guardaremos todos los logs de este hook.

exec >>"$LOG" 2>&1                    # Redirige stdout y stderr al LOG (desde aquí todo queda logueado).
echo "== $(date -Is) POSTDEPLOY: smoke test =="  # Marca de inicio con timestamp ISO.

# ----- Parámetros configurables (con valores por defecto) -----
BASE_URL="${BASE_URL:-http://127.0.0.1}"   # Dónde consultar. 127.0.0.1 = Nginx local de la instancia.
HEALTH_PATH="${HEALTH_PATH:-/healthz}"     # Endpoint de salud esperado (tu vista debe devolver 200).
RETRIES="${RETRIES:-20}"                   # Cuántos intentos hacer antes de declarar fallo.
SLEEP_SECONDS="${SLEEP_SECONDS:-3}"        # Pausa entre intentos (segundos).
CURL_OPTS=(-s -o /dev/null -w "%{http_code}" --max-time 2)
# CURL_OPTS:
#   -s           : modo silencioso (sin barra de progreso).
#   -o /dev/null : descarta el body (no nos interesa).
#   -w "%{http_code}" : imprime SOLO el status code.
#   --max-time 2 : corta si tarda más de 2s (evita colgarse).

# ----- 1) Intento principal: consultar /healthz y esperar un 200 -----
for i in $(seq 1 "$RETRIES"); do          # Bucle 1..RETRIES (20 por defecto).
  code_health=$(curl "${CURL_OPTS[@]}" "$BASE_URL$HEALTH_PATH" || true)
  # curl devuelve sólo el código HTTP; '|| true' evita que un fallo corte el script por 'set -e'.
  if [ "$code_health" = "200" ]; then
    echo "[ok] $HEALTH_PATH responde ($code_health)"   # Éxito inmediato si devuelve 200.
    exit 0
  fi
  echo "[wait] intento $i ($code_health) esperando app…"  # Aún no está lista; registramos y…
  sleep "$SLEEP_SECONDS"                                  # …dormimos SLEEP_SECONDS segundos y reintentamos.
done

# ----- 2) Plan B: compatibilidad con /admin/login si todavía no migraste a /healthz -----
ADMIN_PATH="${DJANGO_ADMIN_URL:-/admin/}"                      # Permite cambiar la ruta del admin por env var.
ADMIN_LOGIN_PATH="${ADMIN_PATH%/}/login/"                      # Se asegura de tener exactamente un '/' antes de 'login/'.
code_admin=$(curl "${CURL_OPTS[@]}" "$BASE_URL$ADMIN_LOGIN_PATH" || true)
if [ "$code_admin" = "200" ] || [ "$code_admin" = "301" ] || [ "$code_admin" = "302" ]; then
  echo "[warn] $HEALTH_PATH no respondió 200; pero $ADMIN_LOGIN_PATH sí ($code_admin)."
  exit 0                                                       # Acepta 200/301/302 como “la app vive”.
fi

# ----- 3) Si nada respondió como debía, fallamos el deploy -----
echo "[error] Health check falló. $HEALTH_PATH=$code_health ; $ADMIN_LOGIN_PATH=$code_admin"
exit 1                                                         # Código de salida ≠ 0 marca error para EB.
