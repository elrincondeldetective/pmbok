#!/usr/bin/env bash
set -Eeuo pipefail

LOG="/var/log/selinux-smoke.log"
exec >>"$LOG" 2>&1
echo "== $(date -Is) POSTDEPLOY: smoke test =="

# Da unos segundos por si el contenedor tarda en quedar listo
for i in {1..10}; do
  if curl -s -I http://127.0.0.1/admin/login/ | head -n1 | grep -E '200|302' >/dev/null; then
    echo "[ok] /admin/login/ responde (200/302)"
    exit 0
  fi
  echo "[wait] intento $i esperando app…"
  sleep 3
done

echo "[error] /admin/login/ no respondió 200/302"
# Salir con error hace que EB marque el deploy como fallido (y te avise)
exit 1
