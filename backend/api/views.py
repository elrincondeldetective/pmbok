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

# --- FUNCIÓN HELPER PARA FUSIONAR DATOS ---


def merge_process_with_customization(process_instance, customization_instance):
    """Sobrescribe los ITTOs del proceso base con los de la personalización si existe."""
    if customization_instance:
        # Reemplaza los datos base con los personalizados si no están vacíos
        if customization_instance.inputs:
            process_instance.inputs = customization_instance.inputs
        if customization_instance.tools_and_techniques:
            process_instance.tools_and_techniques = customization_instance.tools_and_techniques
        if customization_instance.outputs:
            process_instance.outputs = customization_instance.outputs
        # Adjunta el objeto de personalización para que el serializador lo pueda anidar
        process_instance.customization = customization_instance
    else:
        # Asegura que no haya datos de personalización si no se encontró ninguna
        process_instance.customization = None
    return process_instance

# --- VISTAS DE PROCESOS (MODIFICADAS) ---


class ScrumProcessViewSet(viewsets.ModelViewSet):
    queryset = ScrumProcess.objects.select_related('status', 'phase').all()
    serializer_class = ScrumProcessSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        """
        Lista todos los procesos Scrum. Si se provee el query param `country`,
        fusiona los datos base con los de la personalización de ese país.
        """
        queryset = self.get_queryset()
        country_code = request.query_params.get('country', None)

        if country_code:
            # Crea un diccionario de personalizaciones para una búsqueda eficiente
            customizations = {
                custom.process_id: custom
                for custom in ScrumProcessCustomization.objects.filter(country_code=country_code)
            }
            for process in queryset:
                customization = customizations.get(process.id)
                process = merge_process_with_customization(
                    process, customization)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """
        Obtiene un proceso Scrum. Si se provee `country`, busca y fusiona
        la personalización correspondiente.
        """
        instance = self.get_object()
        country_code = request.query_params.get('country', None)

        if country_code:
            try:
                customization = ScrumProcessCustomization.objects.get(
                    process=instance,
                    country_code=country_code
                )
                instance = merge_process_with_customization(
                    instance, customization)
            except ScrumProcessCustomization.DoesNotExist:
                instance.customization = None

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

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
        updated_count = ScrumProcess.objects.filter(
            id__in=process_ids).update(kanban_status=new_status)
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
    queryset = PMBOKProcess.objects.select_related('status', 'stage').all()
    serializer_class = PMBOKProcessSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        """
        Lista todos los procesos PMBOK, aplicando personalización por país si se especifica.
        """
        queryset = self.get_queryset()
        country_code = request.query_params.get('country', None)

        if country_code:
            customizations = {
                custom.process_id: custom
                for custom in PMBOKProcessCustomization.objects.filter(country_code=country_code)
            }
            for process in queryset:
                customization = customizations.get(process.id)
                process = merge_process_with_customization(
                    process, customization)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """
        Obtiene un proceso PMBOK, aplicando personalización por país si se especifica.
        """
        instance = self.get_object()
        country_code = request.query_params.get('country', None)

        if country_code:
            try:
                customization = PMBOKProcessCustomization.objects.get(
                    process=instance,
                    country_code=country_code
                )
                instance = merge_process_with_customization(
                    instance, customization)
            except PMBOKProcessCustomization.DoesNotExist:
                instance.customization = None

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

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
        updated_count = PMBOKProcess.objects.filter(
            id__in=process_ids).update(kanban_status=new_status)
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

# ===== INICIO: NUEVA VISTA PARA GESTIONAR PERSONALIZACIONES =====


class CustomizationViewSet(viewsets.GenericViewSet):
    """
    Endpoint para crear y actualizar personalizaciones de procesos por país.
    Solo necesita el método 'create' ya que el serializador maneja la lógica de 'update_or_create'.
    """
    serializer_class = CustomizationWriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()

        return Response(
            {"message": f"Customization for process in country '{instance.country_code.upper()}' saved successfully."},
            status=status.HTTP_201_CREATED
        )
# ===== FIN: NUEVA VISTA =====

# --- Vista de Tareas (SIN CAMBIOS) ---


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    queryset = Task.objects.all()
    permission_classes = [permissions.IsAuthenticated]
