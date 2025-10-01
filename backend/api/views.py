# backend/api/views.py
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import (
    TaskSerializer, UserRegistrationSerializer, PMBOKProcessSerializer,
    ScrumProcessSerializer, CustomizationWriteSerializer,
    PMBOKProcessCustomizationSerializer, ScrumProcessCustomizationSerializer,
    # ===== INICIO: CAMBIO - IMPORTAR NUEVOS SERIALIZERS Y MODELOS =====
    DepartmentSerializer
)
from .models import (
    Task, CustomUser, PMBOKProcess, ScrumProcess, KANBAN_STATUS_CHOICES,
    PMBOKProcessCustomization, ScrumProcessCustomization,
    Department
    # ===== FIN: CAMBIO =====
)

# --- Vista de Registro (SIN CAMBIOS) ---
class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer


# ===== INICIO: CAMBIO - AÑADIR LA VISTA PARA DEPARTAMENTOS =====
class DepartmentViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows departments to be viewed or edited.
    """
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]
# ===== FIN: CAMBIO =====


# --- VISTAS DE PROCESOS (SIN CAMBIOS EN ESTA ACTUALIZACIÓN) ---
class ScrumProcessViewSet(viewsets.ModelViewSet):
    queryset = ScrumProcess.objects.select_related('status', 'phase').prefetch_related('customizations__department').all()
    serializer_class = ScrumProcessSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='bulk-update-kanban-status')
    def bulk_update_kanban_status(self, request):
        process_ids = request.data.get('process_ids')
        new_status = request.data.get('kanban_status')
        if not isinstance(process_ids, list) or not new_status:
            return Response({'error': 'Se requiere "process_ids" (una lista) y "kanban_status".'}, status=status.HTTP_400_BAD_REQUEST)
        valid_statuses = [choice[0] for choice in KANBAN_STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'error': f'El estado "{new_status}" no es válido.'}, status=status.HTTP_400_BAD_REQUEST)
        
        ScrumProcessCustomization.objects.filter(
            process_id__in=process_ids
        ).update(kanban_status=new_status)
        
        updated_count = ScrumProcess.objects.filter(id__in=process_ids).update(kanban_status=new_status)
        
        return Response({'message': f'{updated_count} procesos de Scrum y sus personalizaciones actualizados a "{new_status}" exitosamente.'})


class PMBOKProcessViewSet(viewsets.ModelViewSet):
    queryset = PMBOKProcess.objects.select_related('status', 'stage').prefetch_related('customizations__department').all()
    serializer_class = PMBOKProcessSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='bulk-update-kanban-status')
    def bulk_update_kanban_status(self, request):
        process_ids = request.data.get('process_ids')
        new_status = request.data.get('kanban_status')
        if not isinstance(process_ids, list) or not new_status:
            return Response({'error': 'Se requiere "process_ids" (una lista) y "kanban_status".'}, status=status.HTTP_400_BAD_REQUEST)
        valid_statuses = [choice[0] for choice in KANBAN_STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'error': f'El estado "{new_status}" no es válido.'}, status=status.HTTP_400_BAD_REQUEST)

        PMBOKProcessCustomization.objects.filter(
            process_id__in=process_ids
        ).update(kanban_status=new_status)
        
        updated_count = PMBOKProcess.objects.filter(id__in=process_ids).update(kanban_status=new_status)
        
        return Response({'message': f'{updated_count} procesos de PMBOK y sus personalizaciones actualizados a "{new_status}" exitosamente.'})


class CustomizationViewSet(viewsets.GenericViewSet):
    serializer_class = CustomizationWriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()

        if isinstance(instance, PMBOKProcessCustomization):
            response_serializer = PMBOKProcessCustomizationSerializer(instance)
        else:
            response_serializer = ScrumProcessCustomizationSerializer(instance)
            
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='update-kanban-status')
    def update_kanban_status(self, request, pk=None):
        instance = None
        model_type = None
        try:
            instance = PMBOKProcessCustomization.objects.get(pk=pk)
            model_type = 'pmbok'
        except PMBOKProcessCustomization.DoesNotExist:
            try:
                instance = ScrumProcessCustomization.objects.get(pk=pk)
                model_type = 'scrum'
            except ScrumProcessCustomization.DoesNotExist:
                return Response({'error': 'Customization not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('kanban_status')
        if new_status is None:
            return Response({'error': 'Se requiere "kanban_status".'}, status=status.HTTP_400_BAD_REQUEST)

        valid_statuses = [choice[0] for choice in KANBAN_STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'error': f'El estado "{new_status}" no es válido.'}, status=status.HTTP_400_BAD_REQUEST)

        instance.kanban_status = new_status
        instance.save(update_fields=['kanban_status'])

        if model_type == 'pmbok':
            serializer = PMBOKProcessCustomizationSerializer(instance)
        else:
            serializer = ScrumProcessCustomizationSerializer(instance)
            
        return Response(serializer.data, status=status.HTTP_200_OK)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    queryset = Task.objects.all()
    permission_classes = [permissions.IsAuthenticated]
