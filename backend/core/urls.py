# backend/core/urls.py
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
import os

def healthz(_request):
    return JsonResponse({"status": "ok"}, status=200)

ADMIN_URL = os.environ.get("DJANGO_ADMIN_URL", "super-admin/")  # <- nueva ruta

urlpatterns = [
    path("healthz/", healthz, name="healthz"),       # nuevo healthcheck
    path(ADMIN_URL, admin.site.urls),                # admin movido
    path("api/", include("api.urls")),
]
