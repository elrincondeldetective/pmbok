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

    # --- NUEVA ACCIÓN: Para actualizar los campos ITTO (inputs, tools, outputs) ---
    @action(detail=True, methods=['patch'], url_path='update-ittos')
    def update_ittos(self, request, pk=None):
        """
        Actualiza los campos JSON de inputs, tools_and_techniques, o outputs.
        """
        process = self.get_object()
        
        # Obtenemos los campos que se van a actualizar del request
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
            
        # Actualizamos el objeto en memoria
        for key, value in data_to_update.items():
            setattr(process, key, value)
            
        # Guardamos solo los campos modificados en la BD
        process.save(update_fields=fields_to_update)
        
        serializer = self.get_serializer(process)
        return Response(serializer.data)


class PMBOKProcessViewSet(viewsets.ModelViewSet):
    queryset = PMBOKProcess.objects.select_related('status', 'stage').all()
    serializer_class = PMBOKProcessSerializer
    permission_classes = [permissions.IsAuthenticated]

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

    # --- NUEVA ACCIÓN: Reutilizamos la misma lógica para PMBOK ---
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
