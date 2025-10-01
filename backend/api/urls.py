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
router.register(r'pmbok-processes', views.PMBOKProcessViewSet)
router.register(r'scrum-processes', views.ScrumProcessViewSet)
router.register(r'customizations', views.CustomizationViewSet,
                basename='customization')
# ===== INICIO: CAMBIO - REGISTRAR LA NUEVA RUTA DE DEPARTAMENTOS =====
router.register(r'departments', views.DepartmentViewSet)
# ===== FIN: CAMBIO =====

urlpatterns = [
    path('', include(router.urls)),

    # --- Rutas de Autenticación JWT ---
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),

    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # --- Ruta de Registro ---
    path('register/', views.RegisterView.as_view(), name='auth_register'),
]
