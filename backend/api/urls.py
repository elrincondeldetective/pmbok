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

urlpatterns = [
    path('', include(router.urls)),

    # --- Rutas de Autenticación JWT ---
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),

    # 👇 CORRECCIÓN: 'as_view()' en lugar de 'as_виew()'
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # --- Ruta de Registro ---
    path('register/', views.RegisterView.as_view(), name='auth_register'),
]