# backend/api/views.py
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import (
    TaskSerializer, UserRegistrationSerializer, PMBOKProcessSerializer,
    ScrumProcessSerializer, CustomizationWriteSerializer
)
from .models import (
    Task, CustomUser, PMBOKProcess, ScrumProcess, KANBAN_STATUS_CHOICES,
    PMBOKProcessCustomization, ScrumProcessCustomization
)

# --- Vista de Registro (SIN CAMBIOS) ---


class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer


# --- VISTAS DE PROCESOS (MODIFICADAS) ---


class ScrumProcessViewSet(viewsets.ModelViewSet):
    # 👉 CAMBIO: Se precargan todas las personalizaciones asociadas a cada proceso.
    queryset = ScrumProcess.objects.select_related('status', 'phase').prefetch_related('customizations').all()
    serializer_class = ScrumProcessSerializer
    permission_classes = [permissions.IsAuthenticated]

    # 👉 CAMBIO: Se eliminan los métodos `list` y `retrieve` personalizados.
    # El comportamiento por defecto de DRF ahora es suficiente gracias al `queryset`
    # y al `serializer` actualizados, que incluirán el array de personalizaciones.

    # Las acciones para Kanban se mantienen, ya que son independientes de la personalización
    @action(detail=False, methods=['post'], url_path='bulk-update-kanban-status')
    def bulk_update_kanban_status(self, request):
        process_ids = request.data.get('process_ids')
        new_status = request.data.get('kanban_status')
        if not isinstance(process_ids, list) or not new_status:
            return Response({'error': 'Se requiere "process_ids" (una lista) y "kanban_status".'}, status=status.HTTP_400_BAD_REQUEST)
        valid_statuses = [choice[0] for choice in KANBAN_STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'error': f'El estado "{new_status}" no es válido.'}, status=status.HTTP_400_BAD_REQUEST)
        updated_count = ScrumProcess.objects.filter(id__in=process_ids).update(kanban_status=new_status)
        return Response({'message': f'{updated_count} procesos de Scrum actualizados a "{new_status}" exitosamente.'})

    @action(detail=True, methods=['patch'], url_path='update-kanban-status')
    def update_kanban_status(self, request, pk=None):
        process = self.get_object()
        new_status = request.data.get('kanban_status')
        valid_statuses = [choice[0] for choice in KANBAN_STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'error': f'El estado "{new_status}" no es válido.'}, status=status.HTTP_400_BAD_REQUEST)
        process.kanban_status = new_status
        process.save(update_fields=['kanban_status'])
        serializer = self.get_serializer(process)
        return Response(serializer.data)


class PMBOKProcessViewSet(viewsets.ModelViewSet):
    # 👉 CAMBIO: Se precargan todas las personalizaciones.
    queryset = PMBOKProcess.objects.select_related('status', 'stage').prefetch_related('customizations').all()
    serializer_class = PMBOKProcessSerializer
    permission_classes = [permissions.IsAuthenticated]

    # 👉 CAMBIO: Se eliminan `list` y `retrieve`.

    # Acciones para Kanban
    @action(detail=False, methods=['post'], url_path='bulk-update-kanban-status')
    def bulk_update_kanban_status(self, request):
        process_ids = request.data.get('process_ids')
        new_status = request.data.get('kanban_status')
        if not isinstance(process_ids, list) or not new_status:
            return Response({'error': 'Se requiere "process_ids" (una lista) y "kanban_status".'}, status=status.HTTP_400_BAD_REQUEST)
        valid_statuses = [choice[0] for choice in KANBAN_STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'error': f'El estado "{new_status}" no es válido.'}, status=status.HTTP_400_BAD_REQUEST)
        updated_count = PMBOKProcess.objects.filter(id__in=process_ids).update(kanban_status=new_status)
        return Response({'message': f'{updated_count} procesos de PMBOK actualizados a "{new_status}" exitosamente.'})

    @action(detail=True, methods=['patch'], url_path='update-kanban-status')
    def update_kanban_status(self, request, pk=None):
        process = self.get_object()
        new_status = request.data.get('kanban_status')
        valid_statuses = [choice[0] for choice in KANBAN_STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'error': f'El estado "{new_status}" no es válido.'}, status=status.HTTP_400_BAD_REQUEST)
        process.kanban_status = new_status
        process.save(update_fields=['kanban_status'])
        serializer = self.get_serializer(process)
        return Response(serializer.data)


class CustomizationViewSet(viewsets.GenericViewSet):
    serializer_class = CustomizationWriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()

        data = {
            "id": instance.id,
            "country_code": instance.country_code,
            "inputs": instance.inputs,
            "tools_and_techniques": instance.tools_and_techniques,
            "outputs": instance.outputs,
        }
        return Response(data, status=status.HTTP_201_CREATED)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    queryset = Task.objects.all()
    permission_classes = [permissions.IsAuthenticated]
