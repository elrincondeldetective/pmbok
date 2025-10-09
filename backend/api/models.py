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
        if not email:
            raise ValueError('El campo Email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser debe tener is_superuser=True.')
        return self.create_user(email, password, **extra_fields)


# --- Modelo de Usuario Personalizado ---
class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    objects = CustomUserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

# --- Modelos de Soporte ---
class ProcessStatus(models.Model):
    name = models.CharField(max_length=100, unique=True,
                            help_text="Ej: Base Estratégica, Ritmo Diario, etc.")
    description = models.TextField(blank=True)
    tailwind_bg_color = models.CharField(max_length=50, default='bg-gray-500',
                                         help_text="Clase de Tailwind para el color de fondo. Ej: bg-indigo-800")
    tailwind_text_color = models.CharField(
        max_length=50, default='text-white', help_text="Clase de Tailwind para el color del texto. Ej: text-white")

    def __str__(self):
        return self.name


class ProcessStage(models.Model):
    name = models.CharField(max_length=100, unique=True,
                            help_text="Ej: Integración (Inicio), Alcance (Planeación)")
    tailwind_bg_color = models.CharField(max_length=50, default='bg-gray-200',
                                         help_text="Clase de Tailwind para el fondo del footer. Ej: bg-gray-200")
    tailwind_text_color = models.CharField(
        max_length=50, default='text-gray-600', help_text="Clase de Tailwind para el texto del footer. Ej: text-gray-800")

    def __str__(self):
        return self.name


class ScrumPhase(models.Model):
    name = models.CharField(max_length=100, unique=True,
                            help_text="Ej: Inicio, Planificación y Estimación")
    tailwind_bg_color = models.CharField(
        max_length=50, default='bg-gray-200', help_text="Clase de Tailwind para el fondo del footer. Ej: bg-sky-100")
    tailwind_text_color = models.CharField(
        max_length=50, default='text-gray-600', help_text="Clase de Tailwind para el texto del footer. Ej: text-sky-800")

    class Meta:
        verbose_name = "Scrum Phase"
        verbose_name_plural = "Scrum Phases"

    def __str__(self):
        return self.name

# ===== INICIO: NUEVO MODELO DE DEPARTAMENTOS JERÁRQUICO =====
class Department(models.Model):
    name = models.CharField(max_length=100, unique=True, help_text="Ej: Finanzas, Marketing Digital, TI")
    description = models.TextField(blank=True)
    tailwind_border_color = models.CharField(
        max_length=50, default='border-gray-500', help_text="Ej: border-blue-500"
    )
    # Campo para la relación jerárquica (padre-hijo)
    parent = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='sub_departments',
        help_text="Departamento padre al que pertenece (si es una subdirección)."
    )

    class Meta:
        ordering = ['name']

    def __str__(self):
        # Muestra la ruta completa, ej: "Marketing -> Marketing Digital"
        if self.parent:
            return f"{self.parent} -> {self.name}"
        return self.name
# ===== FIN: NUEVO MODELO DE DEPARTAMENTOS JERÁRQUICO =====


# --- Choices para Kanban ---
KANBAN_STATUS_CHOICES = [
    ('unassigned', 'No Asignado'),
    ('backlog', 'Pendiente'),
    ('todo', 'Por Hacer'),
    ('in_progress', 'En Progreso'),
    ('in_review', 'En Revisión'),
    ('done', 'Hecho'),
]

# --- Modelo PMBOKProcess ---
class PMBOKProcess(models.Model):
    process_number = models.IntegerField(unique=True)
    name = models.CharField(max_length=255)
    status = models.ForeignKey(ProcessStatus, on_delete=models.SET_NULL,
                               null=True, blank=True, related_name='pmbok_processes')
    stage = models.ForeignKey(ProcessStage, on_delete=models.SET_NULL,
                              null=True, blank=True, related_name='pmbok_processes')
    kanban_status = models.CharField(
        max_length=20,
        choices=KANBAN_STATUS_CHOICES,
        default='unassigned',
        help_text="El estado del proceso en el tablero Kanban."
    )
    inputs = models.JSONField(
        default=list, blank=True, help_text="Lista de objetos de entrada, cada uno con 'name' y 'url'.")
    tools_and_techniques = models.JSONField(
        default=list, blank=True, help_text="Lista de objetos de herramientas, cada uno con 'name' y 'url'.")
    outputs = models.JSONField(
        default=list, blank=True, help_text="Lista de objetos de salida, cada uno con 'name' y 'url'.")

    class Meta:
        ordering = ['process_number']

    def __str__(self):
        return f"{self.process_number}. {self.name}"

# --- Modelo ScrumProcess ---
class ScrumProcess(models.Model):
    process_number = models.IntegerField(unique=True)
    name = models.CharField(max_length=255)
    status = models.ForeignKey(ProcessStatus, on_delete=models.SET_NULL,
                               null=True, blank=True, related_name='scrum_processes_by_status')
    phase = models.ForeignKey(ScrumPhase, on_delete=models.SET_NULL,
                              null=True, blank=True, related_name='scrum_processes_by_phase')
    kanban_status = models.CharField(
        max_length=20,
        choices=KANBAN_STATUS_CHOICES,
        default='unassigned',
        help_text="El estado del proceso en el tablero Kanban."
    )
    inputs = models.JSONField(
        default=list, blank=True, help_text="Lista de objetos de entrada, cada uno con 'name' y 'url'.")
    tools_and_techniques = models.JSONField(
        default=list, blank=True, help_text="Lista de objetos de herramientas, cada uno con 'name' y 'url'.")
    outputs = models.JSONField(
        default=list, blank=True, help_text="Lista de objetos de salida, cada uno con 'name' y 'url'.")

    class Meta:
        ordering = ['process_number']
        verbose_name = "Scrum Process"
        verbose_name_plural = "Scrum Processes"

    def __str__(self):
        return f"{self.process_number}. {self.name}"

# ===== MODELOS DE PERSONALIZACIÓN (MODIFICADOS) =====
class PMBOKProcessCustomization(models.Model):
    """
    Almacena los ITTOs personalizados para un proceso PMBOK específico y un país.
    """
    process = models.ForeignKey(
        PMBOKProcess, on_delete=models.CASCADE, related_name="customizations")
    country_code = models.CharField(
        max_length=2, help_text="Código de 2 letras del país (ej: CO, US).")

    # Campos que se pueden personalizar
    inputs = models.JSONField(default=list, blank=True)
    tools_and_techniques = models.JSONField(default=list, blank=True)
    outputs = models.JSONField(default=list, blank=True)

    # ===== INICIO: CAMBIO - AÑADIR RELACIÓN CON DEPARTAMENTO =====
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="pmbok_customizations")
    # ===== FIN: CAMBIO =====

    kanban_status = models.CharField(
        max_length=20,
        choices=KANBAN_STATUS_CHOICES,
        default='unassigned',
        help_text="El estado de esta personalización en el tablero Kanban."
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Asegura que solo haya una personalización por proceso y país.
        unique_together = ('process', 'country_code', 'department')
        ordering = ['-updated_at']

    def __str__(self):
        return f"PMBOK Customization for {self.process.name} in {self.country_code.upper()}"


class ScrumProcessCustomization(models.Model):
    """
    Almacena los ITTOs personalizados para un proceso Scrum específico y un país.
    """
    process = models.ForeignKey(
        ScrumProcess, on_delete=models.CASCADE, related_name="customizations")
    country_code = models.CharField(
        max_length=2, help_text="Código de 2 letras del país (ej: CO, US).")

    # Campos que se pueden personalizar
    inputs = models.JSONField(default=list, blank=True)
    tools_and_techniques = models.JSONField(default=list, blank=True)
    outputs = models.JSONField(default=list, blank=True)
    
    # ===== INICIO: CAMBIO - AÑADIR RELACIÓN CON DEPARTAMENTO =====
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="scrum_customizations")
    # ===== FIN: CAMBIO =====

    kanban_status = models.CharField(
        max_length=20,
        choices=KANBAN_STATUS_CHOICES,
        default='unassigned',
        help_text="El estado de esta personalización en el tablero Kanban."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Asegura que solo haya una personalización por proceso y país.
        unique_together = ('process', 'country_code', 'department')
        ordering = ['-updated_at']

    def __str__(self):
        return f"Scrum Customization for {self.process.name} in {self.country_code.upper()}"

# --- Modelo de Tareas (SIN CAMBIOS) ---
class Task(models.Model):
    title = models.CharField(max_length=200)
    completed = models.BooleanField(default=False, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
