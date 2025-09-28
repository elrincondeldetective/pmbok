# backend/api/views.py
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import TaskSerializer, UserRegistrationSerializer, PMBOKProcessSerializer, ScrumProcessSerializer
from .models import Task, CustomUser, PMBOKProcess, ScrumProcess, KANBAN_STATUS_CHOICES

# --- Vista para el Registro de Usuarios ---
class RegisterView(generics.CreateAPIView):
    """
    Vista para que nuevos usuarios puedan registrarse.
    """
    queryset = CustomUser.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer

# === CAMBIOS EN LA VISTA DE SCRUM ===
class ScrumProcessViewSet(viewsets.ModelViewSet): # CAMBIO 1: De ReadOnly a ModelViewSet
    """
    API endpoint que permite ver y actualizar los procesos de Scrum.
    """
    queryset = ScrumProcess.objects.select_related('status', 'phase').all()
    serializer_class = ScrumProcessSerializer
    permission_classes = [permissions.IsAuthenticated]

    # CAMBIO 2: Añadida la acción para actualizar el estado Kanban
    @action(detail=True, methods=['patch'], url_path='update-kanban-status')
    def update_kanban_status(self, request, pk=None):
        """
        Actualiza únicamente el estado kanban de un proceso de Scrum.
        """
        process = self.get_object()
        new_status = request.data.get('kanban_status')

        valid_statuses = [choice[0] for choice in KANBAN_STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'El estado "{new_status}" no es válido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        process.kanban_status = new_status
        process.save(update_fields=['kanban_status'])
        
        serializer = self.get_serializer(process)
        return Response(serializer.data)


# PMBOKProcessViewSet (sin cambios funcionales, solo se asegura que use KANBAN_STATUS_CHOICES)
class PMBOKProcessViewSet(viewsets.ModelViewSet):
    """
    API endpoint que permite ver y actualizar los procesos del PMBOK.
    """
    queryset = PMBOKProcess.objects.select_related('status', 'stage').all()
    serializer_class = PMBOKProcessSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['patch'], url_path='update-kanban-status')
    def update_kanban_status(self, request, pk=None):
        """
        Actualiza únicamente el estado kanban de un proceso.
        """
        process = self.get_object()
        new_status = request.data.get('kanban_status')

        valid_statuses = [choice[0] for choice in KANBAN_STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'El estado "{new_status}" no es válido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        process.kanban_status = new_status
        process.save(update_fields=['kanban_status'])
        
        serializer = self.get_serializer(process)
        return Response(serializer.data)


# --- Vista para las Tareas (existente) ---
class TaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint que permite ver o editar tareas.
    """
    serializer_class = TaskSerializer
    queryset = Task.objects.all()
    permission_classes = [permissions.IsAuthenticated]
