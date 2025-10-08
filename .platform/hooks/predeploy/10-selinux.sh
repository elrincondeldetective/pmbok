#!/usr/bin/env bash
set -Eeuo pipefail

LOG="/var/log/selinux-nginx-upstream.log"
# Loggea stdout/err al archivo (queda incluido en los bundles de logs de EB)
exec >>"$LOG" 2>&1
echo "== $(date -Is) PREDEPLOY: SELinux prep =="

# Asegura utilidades (semanage) si no están
if ! command -v semanage >/dev/null 2>&1; then
  dnf -y install policycoreutils policycoreutils-python-utils >/dev/null
fi

echo "[info] SELinux mode: $(getenforce || echo 'unknown')"

# 1) Permitir a Nginx hacer conexiones salientes (proxy al 8000)
if getsebool httpd_can_network_connect | grep -q 'off$'; then
  echo "[fix] Habilitando httpd_can_network_connect"
  setsebool -P httpd_can_network_connect 1
fi

# 2) Asociar el puerto 8000 como http_port_t (para que Nginx pueda conectar)
if ! semanage port -l | grep -E '^http_port_t\b' | grep -qw 8000; then
  echo "[fix] Registrando tcp/8000 como http_port_t"
  semanage port -a -t http_port_t -p tcp 8000 || \
  semanage port -m -t http_port_t -p tcp 8000
fi

echo "[ok] SELinux listo para proxy a :8000"
