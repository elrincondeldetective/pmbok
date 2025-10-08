CID=$(sudo docker ps -q)

sudo docker logs --tail 200 $CID

# 3) Confirma que se ejecutó

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

