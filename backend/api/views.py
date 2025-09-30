# backend/api/views.py
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import TaskSerializer, UserRegistrationSerializer, PMBOKProcessSerializer, ScrumProcessSerializer
from .models import Task, CustomUser, PMBOKProcess, ScrumProcess, KANBAN_STATUS_CHOICES

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer

class ScrumProcessViewSet(viewsets.ModelViewSet):
    queryset = ScrumProcess.objects.select_related('status', 'phase').all()
    serializer_class = ScrumProcessSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='bulk-update-kanban-status')
    def bulk_update_kanban_status(self, request):
        process_ids = request.data.get('process_ids')
        new_status = request.data.get('kanban_status')

        if not isinstance(process_ids, list) or not new_status:
            return Response(
                {'error': 'Se requiere "process_ids" (una lista) y "kanban_status".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        valid_statuses = [choice[0] for choice in KANBAN_STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'El estado "{new_status}" no es válido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        updated_count = ScrumProcess.objects.filter(id__in=process_ids).update(kanban_status=new_status)

        return Response({
            'message': f'{updated_count} procesos de Scrum actualizados a "{new_status}" exitosamente.'
        })

    @action(detail=True, methods=['patch'], url_path='update-kanban-status')
    def update_kanban_status(self, request, pk=None):
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

    # ===== INICIO: NUEVA ACCIÓN =====
    @action(detail=True, methods=['patch'], url_path='update-country')
    def update_country(self, request, pk=None):
        """
        Actualiza el código de país para un proceso específico.
        """
        process = self.get_object()
        country_code = request.data.get('country_code')

        if country_code is not None and (not isinstance(country_code, str) or len(country_code) > 2):
            return Response(
                {'error': 'country_code debe ser un string de 2 caracteres o null.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        process.country_code = country_code
        process.save(update_fields=['country_code'])
        
        serializer = self.get_serializer(process)
        return Response(serializer.data)
    # ===== FIN: NUEVA ACCIÓN =====

    @action(detail=True, methods=['patch'], url_path='update-ittos')
    def update_ittos(self, request, pk=None):
        process = self.get_object()
        
        data_to_update = {}
        fields_to_update = []
        
        if 'inputs' in request.data:
            data_to_update['inputs'] = request.data['inputs']
            fields_to_update.append('inputs')
            
        if 'tools_and_techniques' in request.data:
            data_to_update['tools_and_techniques'] = request.data['tools_and_techniques']
            fields_to_update.append('tools_and_techniques')

        if 'outputs' in request.data:
            data_to_update['outputs'] = request.data['outputs']
            fields_to_update.append('outputs')

        if not fields_to_update:
            return Response(
                {'error': 'No se proporcionaron campos válidos para actualizar (inputs, tools_and_techniques, outputs).'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        for key, value in data_to_update.items():
            setattr(process, key, value)
            
        process.save(update_fields=fields_to_update)
        
        serializer = self.get_serializer(process)
        return Response(serializer.data)


class PMBOKProcessViewSet(viewsets.ModelViewSet):
    queryset = PMBOKProcess.objects.select_related('status', 'stage').all()
    serializer_class = PMBOKProcessSerializer
    permission_classes = [permissions.IsAuthenticated]

    # --- INICIO: NUEVA ACCIÓN PARA ACTUALIZACIÓN MASIVA DE PMBOK ---
    @action(detail=False, methods=['post'], url_path='bulk-update-kanban-status')
    def bulk_update_kanban_status(self, request):
        """
        Actualiza el estado Kanban de múltiples procesos PMBOK a la vez.
        """
        process_ids = request.data.get('process_ids')
        new_status = request.data.get('kanban_status')

        if not isinstance(process_ids, list) or not new_status:
            return Response(
                {'error': 'Se requiere "process_ids" (una lista) y "kanban_status".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        valid_statuses = [choice[0] for choice in KANBAN_STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'El estado "{new_status}" no es válido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        updated_count = PMBOKProcess.objects.filter(id__in=process_ids).update(kanban_status=new_status)

        return Response({
            'message': f'{updated_count} procesos de PMBOK actualizados a "{new_status}" exitosamente.'
        })
    # --- FIN: NUEVA ACCIÓN ---

    @action(detail=True, methods=['patch'], url_path='update-kanban-status')
    def update_kanban_status(self, request, pk=None):
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
    
    # ===== INICIO: NUEVA ACCIÓN =====
    @action(detail=True, methods=['patch'], url_path='update-country')
    def update_country(self, request, pk=None):
        """
        Actualiza el código de país para un proceso PMBOK específico.
        """
        process = self.get_object()
        country_code = request.data.get('country_code')

        if country_code is not None and (not isinstance(country_code, str) or len(country_code) > 2):
            return Response(
                {'error': 'country_code debe ser un string de 2 caracteres o null.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        process.country_code = country_code
        process.save(update_fields=['country_code'])
        
        serializer = self.get_serializer(process)
        return Response(serializer.data)
    # ===== FIN: NUEVA ACCIÓN =====

    @action(detail=True, methods=['patch'], url_path='update-ittos')
    def update_ittos(self, request, pk=None):
        process = self.get_object()
        data_to_update = {}
        fields_to_update = []
        
        if 'inputs' in request.data:
            data_to_update['inputs'] = request.data['inputs']
            fields_to_update.append('inputs')
            
        if 'tools_and_techniques' in request.data:
            data_to_update['tools_and_techniques'] = request.data['tools_and_techniques']
            fields_to_update.append('tools_and_techniques')

        if 'outputs' in request.data:
            data_to_update['outputs'] = request.data['outputs']
            fields_to_update.append('outputs')

        if not fields_to_update:
            return Response(
                {'error': 'No se proporcionaron campos válidos para actualizar.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        for key, value in data_to_update.items():
            setattr(process, key, value)
            
        process.save(update_fields=fields_to_update)
        
        serializer = self.get_serializer(process)
        return Response(serializer.data)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    queryset = Task.objects.all()
    permission_classes = [permissions.IsAuthenticated]

