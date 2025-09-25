# backend/api/views.py
from rest_framework import viewsets, generics, permissions
# Actualizar imports
from .serializers import TaskSerializer, UserRegistrationSerializer, PMBOKProcessSerializer 
# CAMBIO 1: Importar modelos actualizados
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

# PMBOKProcessViewSet (ACTUALIZADO)
class PMBOKProcessViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint que permite ver los procesos del PMBOK.
    """
    # CAMBIO 2: Actualizar la consulta para incluir 'status' y 'stage'
    queryset = PMBOKProcess.objects.select_related('status', 'stage').all()
    serializer_class = PMBOKProcessSerializer
    permission_classes = [permissions.IsAuthenticated]

# --- Vista para las Tareas (existente) ---
class TaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint que permite ver o editar tareas.
    """
    serializer_class = TaskSerializer
    queryset = Task.objects.all()
    # Solo los usuarios autenticados pueden acceder a sus tareas.
    permission_classes = [permissions.IsAuthenticated]

