# backend/api/views.py
from rest_framework import viewsets, generics, permissions
# Actualizar imports
from .serializers import TaskSerializer, UserRegistrationSerializer, PMBOKProcessSerializer 
from .models import Task, CustomUser, PMBOKProcess
from rest_framework.permissions import IsAuthenticatedOrReadOnly

# --- Vista para el Registro de Usuarios ---
class RegisterView(generics.CreateAPIView):
    """
    Vista para que nuevos usuarios puedan registrarse.
    """
    queryset = CustomUser.objects.all()
    permission_classes = (permissions.AllowAny,) # Cualquiera puede registrarse
    serializer_class = UserRegistrationSerializer

# --- NUEVO: ViewSet para los Procesos PMBOK ---
class PMBOKProcessViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint que permite ver los procesos del PMBOK.
    """
    queryset = PMBOKProcess.objects.select_related('state').all()
    serializer_class = PMBOKProcessSerializer
    permission_classes = [permissions.IsAuthenticated] # Solo para usuarios autenticados

# --- Vista para las Tareas (existente) ---
class TaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint que permite ver o editar tareas.
    """
    serializer_class = TaskSerializer
    queryset = Task.objects.all()
    # Solo los usuarios autenticados pueden acceder a sus tareas.
    permission_classes = [permissions.IsAuthenticated]

