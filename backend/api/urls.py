# backend/api/urls.py
from django.urls import path, include
from rest_framework import routers
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = routers.DefaultRouter()
router.register(r'tasks', views.TaskViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # --- Rutas de Autenticación JWT ---
    # Endpoint para iniciar sesión y obtener un token de acceso y refresco.
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # Endpoint para refrescar el token de acceso usando el token de refresco.
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # --- Ruta de Registro ---
    # Endpoint para el registro de nuevos usuarios.
    path('register/', views.RegisterView.as_view(), name='auth_register'),
]
