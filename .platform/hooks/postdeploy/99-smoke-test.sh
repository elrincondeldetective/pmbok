#!/usr/bin/env bash
# .platform/hooks/postdeploy/99-smoke-test.sh
set -Eeuo pipefail

LOG="/var/log/selinux-smoke.log"   # mismo archivo que ya venías usando
exec >>"$LOG" 2>&1
echo "== $(date -Is) POSTDEPLOY: smoke test =="

# Probamos contra 127.0.0.1 (Nginx→contenedor). GET para evitar rarezas con HEAD.
for i in {1..20}; do                     # más paciencia: 20 intentos
  code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/admin/login/ || true)
  if [ "$code" = "200" ] || [ "$code" = "302" ]; then
    echo "[ok] /admin/login/ responde ($code)"
    exit 0
  fi
  echo "[wait] intento $i ($code) esperando app…"
  sleep 3
done

echo "[error] /admin/login/ no respondió 200/302"
exit 1