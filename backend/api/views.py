# backend/api/views.py
from rest_framework import viewsets, generics, permissions
from .serializers import TaskSerializer, UserRegistrationSerializer
from .models import Task, CustomUser

# --- Vista para el Registro de Usuarios ---
class RegisterView(generics.CreateAPIView):
    """
    Vista para que nuevos usuarios puedan registrarse.
    """
    queryset = CustomUser.objects.all()
    permission_classes = (permissions.AllowAny,) # Cualquiera puede registrarse
    serializer_class = UserRegistrationSerializer


# --- Vista para las Tareas (existente) ---
class TaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint que permite ver o editar tareas.
    """
    serializer_class = TaskSerializer
    queryset = Task.objects.all()
    # Solo los usuarios autenticados pueden acceder a sus tareas.
    permission_classes = [permissions.IsAuthenticated]

