#!/usr/bin/env bash
# .platform/hooks/postdeploy/99-smoke-test.sh
set -Eeuo pipefail

LOG="/var/log/selinux-smoke.log"
exec >>"$LOG" 2>&1
echo "== $(date -Is) POSTDEPLOY: smoke test =="

for i in {1..20}; do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/admin/login/ || true)
  if [ "$code" = "200" ] || [ "$code" = "301" ] || [ "$code" = "302" ]; then
    echo "[ok] /admin/login/ responde ($code)"
    exit 0
  fi
  echo "[wait] intento $i ($code) esperando app…"
  sleep 3
done

echo "[error] /admin/login/ no respondió 200/301/302"
exit 1