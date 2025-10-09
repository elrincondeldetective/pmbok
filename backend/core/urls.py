# backend/core/urls.py
import os
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def healthz(_request):
    # Responde 200 sin redirección para /healthz (sin slash)
    return JsonResponse({"status": "ok"}, status=200)

def version(_request):
    # Útil para saber qué build/commit corre en la instancia
    return JsonResponse({"git": os.getenv("APP_GIT_SHA", "unknown")}, status=200)

# Ruta del admin configurable por variable de entorno, normalizada con slash final
ADMIN_URL = os.getenv("DJANGO_ADMIN_URL", "super-admin/")
if not ADMIN_URL.endswith("/"):
    ADMIN_URL += "/"

urlpatterns = [
    path("healthz", healthz, name="healthz"),   # sin slash -> evita 301
    path("version", version, name="version"),   # opcional
    path("api/", include("api.urls")),
    path(ADMIN_URL, admin.site.urls),           # admin movido
]
