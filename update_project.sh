#!/bin/bash

# Este script detendrá su ejecución si algún comando falla.
set -e

echo "🚀 Iniciando la actualización del proyecto para implementar el tablero Kanban..."

# --- Backend: Actualización de la App Django ---
echo "🔄 Actualizando el backend..."

# 1. Modificar el modelo PMBOKProcess para añadir el estado del Kanban
echo "  -> Modificando models.py para añadir 'kanban_status'..."
cat <<'EOF' > backend/api/models.py
# backend/api/models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

# --- Manager para el Modelo de Usuario Personalizado ---
class CustomUserManager(BaseUserManager):
    """
    Manager para nuestro modelo de usuario personalizado.
    Permite crear usuarios y superusuarios usando el email como identificador.
    """
    def create_user(self, email, password=None, **extra_fields):
        """
        Crea y guarda un usuario con el email y contraseña proporcionados.
        """
        if not email:
            raise ValueError('El campo Email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Crea y guarda un superusuario.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser debe tener is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


# --- Modelo de Usuario Personalizado ---
class CustomUser(AbstractBaseUser, PermissionsMixin):
    """
    Modelo de usuario que utiliza el email como nombre de usuario.
    """
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    # El campo que se usará para iniciar sesión
    USERNAME_FIELD = 'email'
    # Campos requeridos al crear un usuario (además de email y password)
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email
    
# --- Modelo para los ESTADOS -> Ahora ESTATUS ---
class ProcessStatus(models.Model):
    name = models.CharField(max_length=100, unique=True, help_text="Ej: Base Estratégica, Ritmo Diario, etc.")
    description = models.TextField(blank=True)
    tailwind_bg_color = models.CharField(max_length=50, default='bg-gray-500', help_text="Clase de Tailwind para el color de fondo. Ej: bg-indigo-800")
    tailwind_text_color = models.CharField(max_length=50, default='text-white', help_text="Clase de Tailwind para el color del texto. Ej: text-white")

    def __str__(self):
        return self.name
    
# --- NUEVO: Modelo para las ETAPAS de los Procesos ---
class ProcessStage(models.Model):
    name = models.CharField(max_length=100, unique=True, help_text="Ej: Integración (Inicio), Alcance (Planeación)")
    tailwind_bg_color = models.CharField(max_length=50, default='bg-gray-200', help_text="Clase de Tailwind para el fondo del footer. Ej: bg-gray-200")
    tailwind_text_color = models.CharField(max_length=50, default='text-gray-600', help_text="Clase de Tailwind para el texto del footer. Ej: text-gray-800")
    
    def __str__(self):
        return self.name

# --- Modelo para los Procesos del PMBOK (ACTUALIZADO) ---
class PMBOKProcess(models.Model):
    # CAMBIO 1: Definir las opciones para el estado Kanban
    KANBAN_STATUS_CHOICES = [
        ('backlog', 'Pendiente'),
        ('todo', 'Por Hacer'),
        ('in_progress', 'En Progreso'),
        ('in_review', 'En Revisión'),
        ('done', 'Hecho'),
    ]

    process_number = models.IntegerField(unique=True)
    name = models.CharField(max_length=255)
    
    status = models.ForeignKey(ProcessStatus, on_delete=models.SET_NULL, null=True, blank=True, related_name='processes')
    stage = models.ForeignKey(ProcessStage, on_delete=models.SET_NULL, null=True, blank=True, related_name='processes')
    
    # CAMBIO 2: Añadir el nuevo campo para el estado del Kanban
    kanban_status = models.CharField(
        max_length=20,
        choices=KANBAN_STATUS_CHOICES,
        default='backlog',
        help_text="El estado del proceso en el tablero Kanban."
    )
    
    inputs = models.TextField(blank=True, help_text="Lista de entradas, separadas por saltos de línea.")
    tools_and_techniques = models.TextField(blank=True, help_text="Lista de herramientas y técnicas, separadas por saltos de línea.")
    outputs = models.TextField(blank=True, help_text="Lista de salidas, separadas por saltos de línea.")

    class Meta:
        ordering = ['process_number']

    def __str__(self):
        return f"{self.process_number}. {self.name}"

# --- Modelo de Tareas (existente) ---
class Task(models.Model):
    title = models.CharField(max_length=200)
    completed = models.BooleanField(default=False, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
EOF

# 2. Modificar el serializador para incluir el nuevo campo
echo "  -> Modificando serializers.py para exponer 'kanban_status'..."
cat <<'EOF' > backend/api/serializers.py
# backend/api/serializers.py
from rest_framework import serializers
from .models import Task, CustomUser, PMBOKProcess, ProcessStatus, ProcessStage
from django.contrib.auth.password_validation import validate_password

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializador para el registro de nuevos usuarios.
    """
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ('email', 'first_name', 'last_name', 'password', 'password2')

    def validate(self, attrs):
        """
        Valida que las dos contraseñas coincidan.
        """
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        return attrs

    def create(self, validated_data):
        """
        Crea un nuevo usuario a partir de los datos validados.
        """
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

class ProcessStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessStatus
        fields = ('name', 'tailwind_bg_color', 'tailwind_text_color')

class ProcessStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessStage
        fields = ('name', 'tailwind_bg_color', 'tailwind_text_color')

class PMBOKProcessSerializer(serializers.ModelSerializer):
    status = ProcessStatusSerializer(read_only=True)
    stage = ProcessStageSerializer(read_only=True)

    class Meta:
        model = PMBOKProcess
        # CAMBIO 1: Añadir 'kanban_status' a los campos serializados
        fields = ('id', 'process_number', 'name', 'status', 'stage', 'kanban_status', 'inputs', 'tools_and_techniques', 'outputs')

# TaskSerializer (Sin cambios)
class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'
EOF

# 3. Modificar la vista para permitir la actualización del estado
echo "  -> Modificando views.py para permitir la actualización del estado Kanban..."
cat <<'EOF' > backend/api/views.py
# backend/api/views.py
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import TaskSerializer, UserRegistrationSerializer, PMBOKProcessSerializer  
from .models import Task, CustomUser, PMBOKProcess

# --- Vista para el Registro de Usuarios ---
class RegisterView(generics.CreateAPIView):
    """
    Vista para que nuevos usuarios puedan registrarse.
    """
    queryset = CustomUser.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer

# PMBOKProcessViewSet (ACTUALIZADO)
# CAMBIO 1: Cambiar de ReadOnlyModelViewSet a ModelViewSet para permitir actualizaciones
class PMBOKProcessViewSet(viewsets.ModelViewSet):
    """
    API endpoint que permite ver y actualizar los procesos del PMBOK.
    """
    queryset = PMBOKProcess.objects.select_related('status', 'stage').all()
    serializer_class = PMBOKProcessSerializer
    permission_classes = [permissions.IsAuthenticated]

    # CAMBIO 2: Crear una acción personalizada para actualizar el estado Kanban
    # Esto crea un endpoint específico: /api/pmbok-processes/{id}/update_kanban_status/
    @action(detail=True, methods=['patch'], url_path='update-kanban-status')
    def update_kanban_status(self, request, pk=None):
        """
        Actualiza únicamente el estado kanban de un proceso.
        Espera un cuerpo de solicitud como: { "kanban_status": "in_progress" }
        """
        process = self.get_object()
        new_status = request.data.get('kanban_status')

        # Validamos que el nuevo estado sea uno de los permitidos en el modelo
        valid_statuses = [choice[0] for choice in PMBOKProcess.KANBAN_STATUS_CHOICES]
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
EOF

# 4. Modificar el script seeder para inicializar el estado
echo "  -> Modificando seed_pmbok.py para inicializar todos los procesos en 'backlog'..."
cat <<'EOF' > backend/api/management/commands/seed_pmbok.py
# backend/api/management/commands/seed_pmbok.py
from django.core.management.base import BaseCommand
from api.models import ProcessStatus, ProcessStage, PMBOKProcess

class Command(BaseCommand):
    help = 'Seeds the database with PMBOK processes, statuses, stages, and ITTOs'

    def handle(self, *args, **options):
        self.stdout.write('Deleting existing data...')
        PMBOKProcess.objects.all().delete()
        ProcessStage.objects.all().delete()
        ProcessStatus.objects.all().delete()

        self.stdout.write('Creating process statuses...')
        status1, _ = ProcessStatus.objects.get_or_create(name="Base Estratégica", defaults={'tailwind_bg_color': 'bg-indigo-800', 'tailwind_text_color': 'text-white'})
        status2_bi, _ = ProcessStatus.objects.get_or_create(name="Ritmo de Sprint (2 Semanas)", defaults={'tailwind_bg_color': 'bg-blue-700', 'tailwind_text_color': 'text-white'})
        status2_d, _ = ProcessStatus.objects.get_or_create(name="Ritmo Diario", defaults={'tailwind_bg_color': 'bg-green-600', 'tailwind_text_color': 'text-white'})
        status3, _ = ProcessStatus.objects.get_or_create(name="Burocracia Innecesaria", defaults={'tailwind_bg_color': 'bg-amber-500', 'tailwind_text_color': 'text-white'})
        status4, _ = ProcessStatus.objects.get_or_create(name="Inaplicable", defaults={'tailwind_bg_color': 'bg-gray-400', 'tailwind_text_color': 'text-gray-800'})

        self.stdout.write('Creating process stages...')
        stage_map = {
            "Integración (Inicio)": ProcessStage.objects.get_or_create(name="Integración (Inicio)", defaults={'tailwind_bg_color': 'bg-gray-200', 'tailwind_text_color': 'text-gray-700'})[0],
            "Integración (Planeación)": ProcessStage.objects.get_or_create(name="Integración (Planeación)", defaults={'tailwind_bg_color': 'bg-gray-200', 'tailwind_text_color': 'text-gray-700'})[0],
            "Integración (Ejecución)": ProcessStage.objects.get_or_create(name="Integración (Ejecución)", defaults={'tailwind_bg_color': 'bg-gray-200', 'tailwind_text_color': 'text-gray-700'})[0],
            "Integración (Monitoreo y Control)": ProcessStage.objects.get_or_create(name="Integración (Monitoreo y Control)", defaults={'tailwind_bg_color': 'bg-gray-200', 'tailwind_text_color': 'text-gray-700'})[0],
            "Integración (Cierre)": ProcessStage.objects.get_or_create(name="Integración (Cierre)", defaults={'tailwind_bg_color': 'bg-gray-200', 'tailwind_text_color': 'text-gray-700'})[0],
            "Interesados (Inicio)": ProcessStage.objects.get_or_create(name="Interesados (Inicio)", defaults={'tailwind_bg_color': 'bg-purple-100', 'tailwind_text_color': 'text-purple-800'})[0],
            "Interesados (Planeación)": ProcessStage.objects.get_or_create(name="Interesados (Planeación)", defaults={'tailwind_bg_color': 'bg-purple-100', 'tailwind_text_color': 'text-purple-800'})[0],
            "Interesados (Ejecución)": ProcessStage.objects.get_or_create(name="Interesados (Ejecución)", defaults={'tailwind_bg_color': 'bg-purple-100', 'tailwind_text_color': 'text-purple-800'})[0],
            "Interesados (Monitoreo y Control)": ProcessStage.objects.get_or_create(name="Interesados (Monitoreo y Control)", defaults={'tailwind_bg_color': 'bg-purple-100', 'tailwind_text_color': 'text-purple-800'})[0],
            "Alcance (Planeación)": ProcessStage.objects.get_or_create(name="Alcance (Planeación)", defaults={'tailwind_bg_color': 'bg-blue-100', 'tailwind_text_color': 'text-blue-800'})[0],
            "Alcance (Monitoreo y Control)": ProcessStage.objects.get_or_create(name="Alcance (Monitoreo y Control)", defaults={'tailwind_bg_color': 'bg-blue-100', 'tailwind_text_color': 'text-blue-800'})[0],
            "Cronograma (Planeación)": ProcessStage.objects.get_or_create(name="Cronograma (Planeación)", defaults={'tailwind_bg_color': 'bg-cyan-100', 'tailwind_text_color': 'text-cyan-800'})[0],
            "Cronograma (Monitoreo y Control)": ProcessStage.objects.get_or_create(name="Cronograma (Monitoreo y Control)", defaults={'tailwind_bg_color': 'bg-cyan-100', 'tailwind_text_color': 'text-cyan-800'})[0],
            "Costos (Planeación)": ProcessStage.objects.get_or_create(name="Costos (Planeación)", defaults={'tailwind_bg_color': 'bg-green-100', 'tailwind_text_color': 'text-green-800'})[0],
            "Costos (Monitoreo y Control)": ProcessStage.objects.get_or_create(name="Costos (Monitoreo y Control)", defaults={'tailwind_bg_color': 'bg-green-100', 'tailwind_text_color': 'text-green-800'})[0],
            "Calidad (Planeación)": ProcessStage.objects.get_or_create(name="Calidad (Planeación)", defaults={'tailwind_bg_color': 'bg-red-100', 'tailwind_text_color': 'text-red-800'})[0],
            "Calidad (Ejecución)": ProcessStage.objects.get_or_create(name="Calidad (Ejecución)", defaults={'tailwind_bg_color': 'bg-red-100', 'tailwind_text_color': 'text-red-800'})[0],
            "Calidad (Monitoreo y Control)": ProcessStage.objects.get_or_create(name="Calidad (Monitoreo y Control)", defaults={'tailwind_bg_color': 'bg-red-100', 'tailwind_text_color': 'text-red-800'})[0],
            "Recursos (Planeación)": ProcessStage.objects.get_or_create(name="Recursos (Planeación)", defaults={'tailwind_bg_color': 'bg-lime-100', 'tailwind_text_color': 'text-lime-800'})[0],
            "Recursos (Ejecución)": ProcessStage.objects.get_or_create(name="Recursos (Ejecución)", defaults={'tailwind_bg_color': 'bg-lime-100', 'tailwind_text_color': 'text-lime-800'})[0],
            "Recursos (Monitoreo y Control)": ProcessStage.objects.get_or_create(name="Recursos (Monitoreo y Control)", defaults={'tailwind_bg_color': 'bg-lime-100', 'tailwind_text_color': 'text-lime-800'})[0],
            "Comunicaciones (Planeación)": ProcessStage.objects.get_or_create(name="Comunicaciones (Planeación)", defaults={'tailwind_bg_color': 'bg-rose-100', 'tailwind_text_color': 'text-rose-800'})[0],
            "Comunicaciones (Ejecución)": ProcessStage.objects.get_or_create(name="Comunicaciones (Ejecución)", defaults={'tailwind_bg_color': 'bg-rose-100', 'tailwind_text_color': 'text-rose-800'})[0],
            "Comunicaciones (Monitoreo y Control)": ProcessStage.objects.get_or_create(name="Comunicaciones (Monitoreo y Control)", defaults={'tailwind_bg_color': 'bg-rose-100', 'tailwind_text_color': 'text-rose-800'})[0],
            "Riesgos (Planeación)": ProcessStage.objects.get_or_create(name="Riesgos (Planeación)", defaults={'tailwind_bg_color': 'bg-amber-100', 'tailwind_text_color': 'text-amber-800'})[0],
            "Riesgos (Ejecución)": ProcessStage.objects.get_or_create(name="Riesgos (Ejecución)", defaults={'tailwind_bg_color': 'bg-amber-100', 'tailwind_text_color': 'text-amber-800'})[0],
            "Riesgos (Monitoreo y Control)": ProcessStage.objects.get_or_create(name="Riesgos (Monitoreo y Control)", defaults={'tailwind_bg_color': 'bg-amber-100', 'tailwind_text_color': 'text-amber-800'})[0],
            "Adquisiciones (Planeación)": ProcessStage.objects.get_or_create(name="Adquisiciones (Planeación)", defaults={'tailwind_bg_color': 'bg-orange-100', 'tailwind_text_color': 'text-orange-800'})[0],
            "Adquisiciones (Ejecución)": ProcessStage.objects.get_or_create(name="Adquisiciones (Ejecución)", defaults={'tailwind_bg_color': 'bg-orange-100', 'tailwind_text_color': 'text-orange-800'})[0],
            "Adquisiciones (Monitoreo y Control)": ProcessStage.objects.get_or_create(name="Adquisiciones (Monitoreo y Control)", defaults={'tailwind_bg_color': 'bg-orange-100', 'tailwind_text_color': 'text-orange-800'})[0],
        }
        
        full_processes_data = [
            (1, "Desarrollar el Acta de Constitución del Proyecto", "Documentos de negocio\nAcuerdos\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nRecopilación de datos\nHabilidades interpersonales y de equipo\nReuniones", "Acta de Constitución del Proyecto\nRegistro de supuestos", status1, stage_map["Integración (Inicio)"]),
            (2, "Identificar a los Interesados", "Acta de Constitución del Proyecto\nDocumentos de negocio\nPlan para la dirección del proyecto\nDocumentos del proyecto\nAcuerdos", "Juicio de expertos\nRecopilación de datos\nAnálisis de datos\nRepresentación de datos\nReuniones", "Registro de interesados\nSolicitudes de cambio\nActualizaciones al plan para la dirección del proyecto", status1, stage_map["Interesados (Inicio)"]),
            (3, "Desarrollar el Plan para la Dirección del Proyecto", "Acta de Constitución del Proyecto\nSalidas de otros procesos\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nRecopilación de datos\nHabilidades interpersonales y de equipo\nReuniones", "Plan para la dirección del proyecto", status3, stage_map["Integración (Planeación)"]),
            (4, "Planificar el Involucramiento de los Interesados", "Acta de Constitución del Proyecto\nPlan para la dirección del proyecto\nDocumentos del proyecto\nAcuerdos\nFactores ambientales de la empresa", "Juicio de expertos\nRecopilación de datos\nToma de decisiones\nRepresentación de datos\nReuniones", "Plan de involucramiento de los interesados", status3, stage_map["Interesados (Planeación)"]),
            (5, "Planificar la Gestión del Alcance", "Acta de Constitución del Proyecto\nPlan para la dirección del proyecto\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nAnálisis de datos\nReuniones", "Plan de gestión del alcance\nPlan de gestión de los requisitos", status1, stage_map["Alcance (Planeación)"]),
            (6, "Recopilar Requisitos", "Acta de Constitución del Proyecto\nPlan para la dirección del proyecto\nDocumentos del proyecto\nDocumentos de negocio\nAcuerdos", "Juicio de expertos\nRecopilación de datos\nAnálisis de datos\nRepresentación de datos\nHabilidades interpersonales y de equipo\nDiagrama de contexto\nPrototipos", "Documentación de requisitos\nMatriz de trazabilidad de requisitos", status1, stage_map["Alcance (Planeación)"]),
            (7, "Definir el Alcance", "Acta de Constitución del Proyecto\nPlan para la dirección del proyecto\nDocumentos del proyecto\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nAnálisis de datos\nToma de decisiones\nHabilidades interpersonales y de equipo\nAnálisis del producto", "Enunciado del alcance del proyecto\nActualizaciones a los documentos del proyecto", status1, stage_map["Alcance (Planeación)"]),
            (8, "Crear la EDT/WBS", "Plan para la dirección del proyecto\nDocumentos del proyecto\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nDescomposición", "Línea base del alcance\nActualizaciones a los documentos del proyecto", status1, stage_map["Alcance (Planeación)"]),
            (9, "Planificar la Gestión del Cronograma", "Acta de Constitución del Proyecto\nPlan para la dirección del proyecto\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nAnálisis de datos\nReuniones", "Plan de gestión del cronograma", status1, stage_map["Cronograma (Planeación)"]),
            (10, "Definir las Actividades", "Plan para la dirección del proyecto\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nDescomposición\nPlanificación gradual\nReuniones", "Lista de actividades\nAtributos de la actividad\nLista de hitos\nSolicitudes de cambio", status3, stage_map["Cronograma (Planeación)"]),
            (11, "Secuenciar las Actividades", "Plan para la dirección del proyecto\nDocumentos del proyecto\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Método de diagramación por precedencia (PDM)\nDeterminación e integración de las dependencias\nAdelantos y retrasos\nSistema de información para la dirección de proyectos", "Diagramas de red del cronograma del proyecto\nActualizaciones a los documentos del proyecto", status3, stage_map["Cronograma (Planeación)"]),
            (12, "Planificar la Gestión de los Riesgos", "Acta de Constitución del Proyecto\nPlan para la dirección del proyecto\nDocumentos del proyecto\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nAnálisis de datos\nReuniones", "Plan de gestión de los riesgos", status1, stage_map["Riesgos (Planeación)"]),
            (13, "Identificar los Riesgos", "Plan para la dirección del proyecto\nDocumentos del proyecto\nAcuerdos\nDocumentación de las adquisiciones\nFactores ambientales de la empresa", "Juicio de expertos\nRecopilación de datos\nAnálisis de datos\nHabilidades interpersonales y de equipo\nListas rápidas\nReuniones", "Registro de riesgos\nInforme de riesgos\nActualizaciones a los documentos del proyecto", status1, stage_map["Riesgos (Planeación)"]),
            (14, "Realizar el Análisis Cualitativo de Riesgos", "Plan para la dirección del proyecto\nDocumentos del proyecto\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nRecopilación de datos\nAnálisis de datos\nHabilidades interpersonales y de equipo\nCategorización de riesgos\nRepresentación de datos\nReuniones", "Actualizaciones a los documentos del proyecto", status3, stage_map["Riesgos (Planeación)"]),
            (15, "Realizar el Análisis Cuantitativo de Riesgos", "Plan para la dirección del proyecto\nDocumentos del proyecto\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nRecopilación de datos\nHabilidades interpersonales y de equipo\nRepresentaciones de la incertidumbre\nAnálisis de datos", "Actualizaciones a los documentos del proyecto", status4, stage_map["Riesgos (Planeación)"]),
            (16, "Planificar la Respuesta a los Riesgos", "Plan para la dirección del proyecto\nDocumentos del proyecto\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nRecopilación de datos\nHabilidades interpersonales y de equipo\nEstrategias para amenazas y oportunidades\nEstrategias para el riesgo general del proyecto\nAnálisis de datos\nToma de decisiones", "Solicitudes de cambio\nActualizaciones al plan para la dirección del proyecto", status3, stage_map["Riesgos (Planeación)"]),
            (17, "Planificar la Gestión de Recursos", "Acta de Constitución del Proyecto\nPlan para la dirección del proyecto\nDocumentos del proyecto\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nRepresentación de datos\nTeoría de la organización\nReuniones", "Plan de gestión de los recursos\nActa de constitución del equipo\nActualizaciones a los documentos del proyecto", status4, stage_map["Recursos (Planeación)"]),
            (18, "Estimar los Recursos de las Actividades", "Plan para la dirección del proyecto\nDocumentos del proyecto\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nEstimación ascendente\nEstimación análoga\nEstimación paramétrica\nAnálisis de datos\nSistema de información para la dirección de proyectos\nReuniones", "Requisitos de recursos\nBase de las estimaciones\nEstructura de desglose de recursos", status4, stage_map["Recursos (Planeación)"]),
            (19, "Planificar la Gestión de los Costos", "Acta de Constitución del Proyecto\nPlan para la dirección del proyecto\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nAnálisis de datos\nReuniones", "Plan de gestión de los costos", status1, stage_map["Costos (Planeación)"]),
            (20, "Estimar los Costos", "Plan para la dirección del proyecto\nDocumentos del proyecto\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nEstimación análoga\nEstimación paramétrica\nEstimación ascendente\nEstimación por tres valores\nAnálisis de datos\nToma de decisiones", "Estimaciones de costos\nBase de las estimaciones\nActualizaciones a los documentos del proyecto", status4, stage_map["Costos (Planeación)"]),
            (21, "Estimar la Duración de las Actividades", "Plan para la dirección del proyecto\nDocumentos del proyecto\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nEstimación análoga\nEstimación paramétrica\nEstimación por tres valores\nEstimación ascendente\nAnálisis de datos\nToma de decisiones\nReuniones", "Estimaciones de la duración\nBase de las estimaciones\nActualizaciones a los documentos del proyecto", status3, stage_map["Cronograma (Planeación)"]),
            (22, "Desarrollar el Cronograma", "Plan para la dirección del proyecto\nDocumentos del proyecto\nAcuerdos\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Análisis de la red del cronograma\nMétodo de la ruta crítica\nOptimización de recursos\nAnálisis de datos\nAdelantos y retrasos\nCompresión del cronograma\nPlanificación ágil de liberaciones", "Línea base del cronograma\nCronograma del proyecto\nDatos del cronograma\nCalendarios del proyecto", status3, stage_map["Cronograma (Planeación)"]),
            (23, "Determinar el Presupuesto", "Plan para la dirección del proyecto\nDocumentos del proyecto\nDocumentos de negocio\nAcuerdos\nFactores ambientales de la empresa", "Juicio de expertos\nAgregación de costos\nAnálisis de datos\nRevisión de información histórica\nConciliación del límite de financiamiento\nFinanciamiento", "Línea base de costos\nRequisitos de financiamiento del proyecto\nActualizaciones a los documentos del proyecto", status1, stage_map["Costos (Planeación)"]),
            (24, "Planificar la Gestión de la Calidad", "Acta de Constitución del Proyecto\nPlan para la dirección del proyecto\nDocumentos del proyecto\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nRecopilación de datos\nAnálisis de datos\nToma de decisiones\nRepresentación de datos\nPlanificación de pruebas e inspección\nReuniones", "Plan de gestión de la calidad\nMétricas de calidad\nActualizaciones al plan para la dirección del proyecto", status3, stage_map["Calidad (Planeación)"]),
            (25, "Planificar la Gestión de las Comunicaciones", "Acta de Constitución del Proyecto\nPlan para la dirección del proyecto\nDocumentos del proyecto\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nAnálisis de requisitos de comunicación\nTecnología de la comunicación\nModelos de comunicación\nMétodos de comunicación\nHabilidades interpersonales y de equipo", "Plan de gestión de las comunicaciones\nActualizaciones al plan para la dirección del proyecto", status3, stage_map["Comunicaciones (Planeación)"]),
            (26, "Planificar la Gestión de las Adquisiciones", "Documentos de negocio\nPlan para la dirección del proyecto\nDocumentos del proyecto\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nRecopilación de datos\nAnálisis de datos\nAnálisis de hacer o comprar\nCriterios de selección de proveedores\nReuniones", "Plan de gestión de las adquisiciones\nEstrategia de la adquisición\nDocumentos de la licitación", status4, stage_map["Adquisiciones (Planeación)"]),
            (27, "Dirigir y Gestionar el Trabajo del Proyecto", "Plan para la dirección del proyecto\nDocumentos del proyecto\nSolicitudes de cambio aprobadas\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nSistema de información para la dirección de proyectos\nReuniones", "Entregables\nDatos de desempeño del trabajo\nRegistro de incidentes\nSolicitudes de cambio", status2_d, stage_map["Integración (Ejecución)"]),
            (28, "Gestionar el Conocimiento del Proyecto", "Plan para la dirección del proyecto\nDocumentos del proyecto\nEntregables\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nGestión del conocimiento\nGestión de la información\nHabilidades interpersonales y de equipo", "Registro de lecciones aprendidas\nActualizaciones al plan para la dirección del proyecto\nActualizaciones a los activos de los procesos", status2_bi, stage_map["Integración (Ejecución)"]),
            (29, "Gestionar el Involucramiento de los Interesados", "Plan para la dirección del proyecto\nDocumentos del proyecto\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nHabilidades de comunicación\nHabilidades interpersonales y de equipo\nReglas básicas\nReuniones", "Solicitudes de cambio\nActualizaciones al plan para la dirección del proyecto\nActualizaciones a los documentos del proyecto", status2_bi, stage_map["Interesados (Ejecución)"]),
            (30, "Adquirir Recursos", "Plan para la dirección del proyecto\nDocumentos del proyecto\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Toma de decisiones\nHabilidades interpersonales y de equipo\nAsignación previa\nEquipos virtuais", "Asignaciones de recursos físicos\nAsignaciones del equipo del proyecto\nCalendarios de recursos\nSolicitudes de cambio", status4, stage_map["Recursos (Ejecución)"]),
            (31, "Desarrollar el Equipo", "Plan para la dirección del proyecto\nDocumentos del proyecto\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Coubicación (Colocation)\nEquipos virtuais\nTecnología de la comunicación\nHabilidades interpersonales y de equipo\nReconocimiento y recompensas\nCapacitación\nEvaluaciones individuales y de equipo\nReuniones", "Evaluaciones del desempeño del equipo\nSolicitudes de cambio\nActualizaciones al plan para la dirección del proyecto", status3, stage_map["Recursos (Ejecución)"]),
            (32, "Dirigir al Equipo", "Plan para la dirección del proyecto\nDocumentos del proyecto\nInformes de desempenho del trabajo\nEvaluaciones del desempeño del equipo\nFactores ambientales de la empresa", "Habilidades interpersonales y de equipo\nSistema de información para la dirección de proyectos", "Solicitudes de cambio\nActualizaciones al plan para la dirección del proyecto\nActualizaciones a los documentos del proyecto", status2_d, stage_map["Recursos (Ejecución)"]),
            (34, "Efectuar las Adquisiciones", "Plan para la dirección del proyecto\nDocumentos del proyecto\nDocumentación de las adquisiciones\nPropuestas de los vendedores\nFactores ambientales de la empresa", "Juicio de expertos\nPublicidad\nConferencias de oferentes\nAnálisis de datos\nHabilidades interpersonales y de equipo", "Vendedores seleccionados\nAcuerdos\nSolicitudes de cambio\nActualizaciones al plan para la dirección del proyecto", status4, stage_map["Adquisiciones (Ejecución)"]),
            (36, "Implementar la Respuesta a los Riesgos", "Plan para la dirección del proyecto\nDocumentos del proyecto\nActivos de los procesos de la organización", "Juicio de expertos\nHabilidades interpersonales y de equipo\nSistema de información para la dirección de proyectos", "Solicitudes de cambio\nActualizaciones a los documentos del proyecto", status3, stage_map["Riesgos (Ejecución)"]),
            (37, "Monitorear y Controlar el Trabajo del Proyecto", "Plan para la dirección del proyecto\nDocumentos del proyecto\nInformación de desempeño del trabajo\nAcuerdos\nFactores ambientales de la empresa", "Juicio de expertos\nAnálisis de datos\nToma de decisiones\nReuniones", "Informes de desempeño del trabajo\nSolicitudes de cambio\nActualizaciones al plan para la dirección del proyecto", status2_bi, stage_map["Integración (Monitoreo y Control)"]),
            (38, "Realizar el Control Integrado de Cambios", "Plan para la dirección del proyecto\nDocumentos del proyecto\nInformes de desempenho del trabajo\nSolicitudes de cambio\nFactores ambientales de la empresa", "Juicio de expertos\nHerramientas de control de cambios\nAnálisis de datos\nToma de decisiones\nReuniones", "Solicitudes de cambio aprobadas\nActualizaciones al plan para la dirección del proyecto\nActualizaciones a los documentos del proyecto", status2_bi, stage_map["Integración (Monitoreo y Control)"]),
            (40, "Controlar el Cronograma", "Plan para la dirección del proyecto\nDocumentos del proyecto\nDatos de desempeño del trabajo\nActivos de los procesos de la organización", "Análisis de datos\nMétodo de la ruta crítica\nSistema de información para la dirección de proyectos\nOptimización de recursos\nAdelantos y retrasos\nCompresión del cronograma", "Información de desempeño del trabajo\nPronósticos del cronograma\nSolicitudes de cambio", status4, stage_map["Cronograma (Monitoreo y Control)"]),
            (41, "Controlar los Costos", "Plan para la dirección del proyecto\nDocumentos del proyecto\nRequisitos de financiamiento del proyecto\nDatos de desempeño del trabajo\nActivos de los procesos de la organización", "Juicio de expertos\nAnálisis de datos\nÍndice de Desempeño del Trabajo por Completar (TCPI)\nSistema de información para la dirección de proyectos", "Información de desempeño del trabajo\nPronósticos de costos\nSolicitudes de cambio", status4, stage_map["Costos (Monitoreo y Control)"]),
            (42, "Monitorear las Comunicaciones", "Plan para la dirección del proyecto\nDocumentos del proyecto\nDatos de desempeño del trabajo\nFactores ambientales de la empresa\nActivos de los procesos de la organización", "Juicio de expertos\nSistema de información para la dirección de proyectos (PMIS)\nRepresentación de datos\nHabilidades interpersonales y de equipo\nReuniones", "Información de desempeño del trabajo\nSolicitudes de cambio\nActualizaciones al plan para la dirección del proyecto", status4, stage_map["Comunicaciones (Monitoreo y Control)"]),
            (43, "Monitorear los Riesgos", "Plan para la dirección del proyecto\nDocumentos del proyecto\nDatos de desempeño del trabajo\nInformes de desempenho del trabajo", "Análisis de datos\nAuditorías de riesgos\nReuniones", "Información de desempeño del trabajo\nSolicitudes de cambio\nActualizaciones al plan para la dirección del proyecto", status2_bi, stage_map["Riesgos (Monitoreo y Control)"]),
            (44, "Controlar los Recursos", "Plan para la dirección del proyecto\nDocumentos del proyecto\nDatos de desempeño del trabajo\nAcuerdos\nActivos de los procesos de la organización", "Análisis de datos\nResolución de problemas\nHabilidades interpersonales y de equipo\nSistema de información para la dirección de proyectos (PMIS)", "Información de desempeño del trabajo\nSolicitudes de cambio\nActualizaciones al plan para la dirección del proyecto", status4, stage_map["Recursos (Monitoreo y Control)"]),
            (45, "Controlar la Calidad", "Plan para la dirección del proyecto\nDocumentos del proyecto\nSolicitudes de cambio aprobadas\nEntregables\nDatos de desempeño del trabajo", "Recopilación de datos\nAnálisis de datos\nInspección\nPruebas/Evaluaciones de producto\nRepresentación de datos\nReuniones", "Mediciones de control de calidad\nEntregables verificados\nInformación de desempeño del trabajo", status2_bi, stage_map["Calidad (Monitoreo y Control)"]),
            (46, "Validar el Alcance", "Plan para la dirección del proyecto\nDocumentos del proyecto\nEntregables verificados\nDatos de desempeño del trabajo", "Inspección\nToma de decisiones", "Entregables aceptados\nInformación de desempeño del trabajo\nSolicitudes de cambio", status2_bi, stage_map["Alcance (Monitoreo y Control)"]),
            (47, "Controlar el Alcance", "Plan para la dirección del proyecto\nDocumentos del proyecto\nDatos de desempeño del trabajo\nActivos de los procesos de la organización", "Análisis de datos\nAnálisis de variación", "Información de desempeño del trabajo\nSolicitudes de cambio\nActualizaciones al plan para la dirección del proyecto", status4, stage_map["Alcance (Monitoreo y Control)"]),
            (48, "Controlar las Adquisiciones", "Plan para la dirección del proyecto\nDocumentos del proyecto\nAcuerdos\nDocumentación de las adquisiciones\nSolicitudes de cambio aprobadas\nDatos de desempeño del trabajo", "Juicio de expertos\nAdministración de reclamaciones\nAnálisis de datos\nInspección\nAuditorías", "Adquisiciones cerradas\nInformación de desempeño del trabajo\nSolicitudes de cambio", status4, stage_map["Adquisiciones (Monitoreo y Control)"]),
            (49, "Cerrar el Proyecto o Fase", "Acta de Constitución del Proyecto\nPlan para la dirección del proyecto\nDocumentos del proyecto\nEntregables aceptados\nDocumentos de negocio\nAcuerdos", "Juicio de expertos\nRecopilación de datos\nAnálisis de datos\nReuniones", "Transferencia del producto, servicio o resultado final\nInforme final\nActualizaciones a los activos de los procesos", status4, stage_map["Integración (Cierre)"]),
        ]


        self.stdout.write('Seeding PMBOK processes with all details...')
        for num, name, inputs, tools, outputs, status_obj, stage_obj in full_processes_data:
            PMBOKProcess.objects.create(
                process_number=num,
                name=name,
                inputs=inputs,
                tools_and_techniques=tools,
                outputs=outputs,
                status=status_obj,
                stage=stage_obj,
                # CAMBIO: Establecemos el estado Kanban por defecto a 'backlog'
                kanban_status='backlog' 
            )
        
        self.stdout.write(self.style.SUCCESS('Database has been seeded successfully with all details!'))
EOF

# --- Frontend: Actualización de la App React ---
echo "🔄 Actualizando el frontend..."

# 5. Crear el directorio para los componentes del dashboard
echo "  -> Creando el directorio 'frontend/src/components/dashboard' (si no existe)..."
mkdir -p frontend/src/components/dashboard

# 6. Actualizar la interfaz de tipos
echo "  -> Actualizando la interfaz IProcess en 'frontend/src/types/process.ts'..."
cat <<'EOF' > frontend/src/types/process.ts
// frontend/src/types/process.ts
export interface IProcessStatus {
    name: string;
    tailwind_bg_color: string;
    tailwind_text_color: string;
}

export interface IProcessStage {
    name: string;
    tailwind_bg_color: string;
    tailwind_text_color: string;
}

export interface IProcess {
    id: number;
    process_number: number;
    name: string;
    status: IProcessStatus | null;
    stage: IProcessStage | null;
    // CAMBIO: Añadir el nuevo estado Kanban al tipo
    kanban_status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
    inputs: string;
    tools_and_techniques: string;
    outputs: string;
}
EOF

# 7. Crear el nuevo componente del tablero Kanban
echo "  -> Creando el nuevo componente 'frontend/src/components/dashboard/KanbanBoard.tsx'..."
cat <<'EOF' > frontend/src/components/dashboard/KanbanBoard.tsx
// frontend/src/components/dashboard/KanbanBoard.tsx
import React, { useState, useEffect } from 'react';
import type { IProcess } from '../../types/process';
import apiClient from '../../api/apiClient';

// Definimos los tipos para las columnas y su configuración
type KanbanStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

interface ColumnConfig {
    title: string;
    color: string;
}

const columnConfig: Record<KanbanStatus, ColumnConfig> = {
    backlog: { title: 'Pendiente (Backlog)', color: 'border-t-gray-400' },
    todo: { title: 'Por Hacer (To Do)', color: 'border-t-blue-500' },
    in_progress: { title: 'En Progreso (In Progress)', color: 'border-t-yellow-500' },
    in_review: { title: 'En Revisión (In Review)', color: 'border-t-purple-500' },
    done: { title: 'Hecho (Done)', color: 'border-t-green-500' },
};

const columnOrder: KanbanStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];

interface KanbanBoardProps {
    initialProcesses: IProcess[];
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ initialProcesses }) => {
    const [columns, setColumns] = useState<Record<KanbanStatus, IProcess[]>>({
        backlog: [], todo: [], in_progress: [], in_review: [], done: []
    });

    // Efecto para organizar los procesos en columnas cuando cambian los props iniciales
    useEffect(() => {
        const newColumns: Record<KanbanStatus, IProcess[]> = {
            backlog: [], todo: [], in_progress: [], in_review: [], done: []
        };
        initialProcesses.forEach(process => {
            if (newColumns[process.kanban_status]) {
                newColumns[process.kanban_status].push(process);
            }
        });
        setColumns(newColumns);
    }, [initialProcesses]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, processId: number, fromColumn: KanbanStatus) => {
        e.dataTransfer.setData('processId', processId.toString());
        e.dataTransfer.setData('fromColumn', fromColumn);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Necesario para permitir el drop
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, toColumn: KanbanStatus) => {
        e.preventDefault();
        const processId = Number(e.dataTransfer.getData('processId'));
        const fromColumn = e.dataTransfer.getData('fromColumn') as KanbanStatus;

        if (processId && fromColumn !== toColumn) {
            const processToMove = columns[fromColumn].find(p => p.id === processId);

            if (processToMove) {
                // Optimistic UI Update
                const newSourceColumn = columns[fromColumn].filter(p => p.id !== processId);
                const newDestColumn = [...columns[toColumn], { ...processToMove, kanban_status: toColumn }];

                setColumns(prev => ({
                    ...prev,
                    [fromColumn]: newSourceColumn,
                    [toColumn]: newDestColumn,
                }));

                // API Call
                try {
                    await apiClient.patch(`/pmbok-processes/${processId}/update-kanban-status/`, {
                        kanban_status: toColumn
                    });
                } catch (error) {
                    console.error("Error al actualizar el estado del proceso:", error);
                    // Revertir el cambio si la API falla
                    setColumns(prev => {
                        // Volvemos a buscar el proceso en la columna de destino
                        const revertedDestColumn = prev[toColumn].filter(p => p.id !== processId);
                        // Lo devolvemos a la columna original
                        const revertedSourceColumn = [...prev[fromColumn], processToMove];
                        return {
                            ...prev,
                            [fromColumn]: revertedSourceColumn,
                            [toColumn]: revertedDestColumn,
                        }
                    });
                }
            }
        }
    };

    return (
        <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {columnOrder.map(columnKey => (
                    <div
                        key={columnKey}
                        className="bg-gray-100 rounded-lg p-4 flex flex-col"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, columnKey)}
                    >
                        <h3 className={`font-bold text-gray-700 pb-3 mb-3 border-b-4 ${columnConfig[columnKey].color}`}>
                            {columnConfig[columnKey].title}
                            <span className="ml-2 bg-gray-300 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">{columns[columnKey]?.length || 0}</span>
                        </h3>
                        <div className="space-y-3 flex-grow min-h-48">
                            {columns[columnKey]?.map(process => (
                                <div
                                    key={process.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, process.id, columnKey)}
                                    className="bg-white p-3 rounded-md shadow hover:shadow-lg cursor-grab active:cursor-grabbing border-l-4"
                                    style={{ borderColor: process.status?.tailwind_bg_color.startsWith('bg-') ? `var(--color-${process.status.tailwind_bg_color.substring(3)})` : '#ccc' }}
                                >
                                    <p className="text-sm font-semibold text-gray-800">{process.process_number}. {process.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
             {/* Hack para asegurar que los colores de Tailwind estén disponibles para style binding */}
            <span className="hidden border-t-gray-400 border-t-blue-500 border-t-yellow-500 border-t-purple-500 border-t-green-500"></span>
        </div>
    );
};

export default KanbanBoard;
EOF

# 8. Modificar el componente Dashboard para incluir el tablero
echo "  -> Modificando 'frontend/src/components/Dashboard.tsx' para renderizar el tablero..."
cat <<'EOF' > frontend/src/components/Dashboard.tsx
// frontend/src/components/Dashboard.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useProcesses } from '../hooks/useProcesses'; 

import DashboardNav from './dashboard/DashboardNav';
import FilterLegend from './dashboard/FilterLegend';
import ProcessGrid from './dashboard/ProcessGrid';
// CAMBIO 1: Importar el nuevo tablero Kanban
import KanbanBoard from './dashboard/KanbanBoard';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    
    const { processes, loading, error } = useProcesses();

    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [selectedStage, setSelectedStage] = useState<string | null>(null);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
    };

    const handleStatusFilterClick = (statusName: string) => {
        setSelectedStatus(prev => (prev === statusName ? null : statusName));
    };

    const handleStageFilterClick = (stageName: string) => {
        setSelectedStage(prev => (prev === stageName ? null : stageName));
    };

    const clearFilters = () => {
        setSelectedStatus(null);
        setSelectedStage(null);
    };

    const filteredProcesses = useMemo(() => {
        if (!processes) return [];
        return processes.filter(process => {
            const statusMatch = selectedStatus ? process.status?.name === selectedStatus : true;
            const stageMatch = selectedStage ? process.stage?.name?.startsWith(selectedStage) : true;
            return statusMatch && stageMatch;
        });
    }, [processes, selectedStatus, selectedStage]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-gray-100 text-gray-700">Cargando procesos...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen bg-gray-100 text-red-600 font-semibold">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <DashboardNav onLogout={handleLogout} />
            <main>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    
                    {/* CAMBIO 2: Añadir el tablero Kanban */}
                    {processes && <KanbanBoard initialProcesses={processes} />}

                    <header className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-800">Guía PMBOK 6ª Edición – 49 Procesos</h1>
                        <p className="text-gray-600 mt-2">Una visión adaptada a un entorno de trabajo ágil.</p>
                    </header>
                    
                    <FilterLegend 
                        selectedStatus={selectedStatus}
                        selectedStage={selectedStage}
                        onStatusFilterClick={handleStatusFilterClick}
                        onStageFilterClick={handleStageFilterClick}
                        onClearFilters={clearFilters}
                    />
                    
                    <ProcessGrid processes={filteredProcesses} />
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
EOF

echo ""
echo "✅ ¡Script de actualización completado con éxito!"
echo "Para aplicar los cambios, guarda este script como 'update_project.sh' en la raíz de tu proyecto y luego ejecútalo con:"
echo "chmod +x update_project.sh"
echo "./update_project.sh"
echo ""
echo "⚠️  Recuerda ejecutar las migraciones y reiniciar la base de datos de Django después de correr el script."
