#!/usr/bin/env bash
set -Eeuo pipefail

LOG="/var/log/selinux-smoke.log"
exec >>"$LOG" 2>&1
echo "== $(date -Is) POSTDEPLOY: smoke test =="

BASE_URL="${BASE_URL:-http://127.0.0.1}"
HEALTH_PATH="${HEALTH_PATH:-/healthz}"
RETRIES="${RETRIES:-20}"
SLEEP_SECONDS="${SLEEP_SECONDS:-3}"
CURL_OPTS=(-s -o /dev/null -w "%{http_code}" --max-time 2)

for i in $(seq 1 "$RETRIES"); do
  code_health=$(curl "${CURL_OPTS[@]}" "$BASE_URL$HEALTH_PATH" || true)
  if [ "$code_health" = "200" ]; then
    echo "[ok] $HEALTH_PATH responde ($code_health)"
    exit 0
  fi
  echo "[wait] intento $i ($code_health) esperando app…"
  sleep "$SLEEP_SECONDS"
done

ADMIN_PATH="${DJANGO_ADMIN_URL:-/admin/}"
ADMIN_LOGIN_PATH="${ADMIN_PATH%/}/login/"
code_admin=$(curl "${CURL_OPTS[@]}" "$BASE_URL$ADMIN_LOGIN_PATH" || true)
if [ "$code_admin" = "200" ] || [ "$code_admin" = "301" ] || [ "$code_admin" = "302" ]; then
  echo "[warn] $HEALTH_PATH no respondió 200; pero $ADMIN_LOGIN_PATH sí ($code_admin)."
  exit 0
fi

echo "[error] Health check falló. $HEALTH_PATH=$code_health ; $ADMIN_LOGIN_PATH=$code_admin"
exit 1
