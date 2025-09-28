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
    
# --- Modelo para las ETAPAS (Áreas de Conocimiento) de PMBOK ---
class ProcessStage(models.Model):
    name = models.CharField(max_length=100, unique=True, help_text="Ej: Integración (Inicio), Alcance (Planeación)")
    tailwind_bg_color = models.CharField(max_length=50, default='bg-gray-200', help_text="Clase de Tailwind para el fondo del footer. Ej: bg-gray-200")
    tailwind_text_color = models.CharField(max_length=50, default='text-gray-600', help_text="Clase de Tailwind para el texto del footer. Ej: text-gray-800")
    
    def __str__(self):
        return self.name

# --- NUEVO: Modelo para las FASES de los Procesos Scrum ---
class ScrumPhase(models.Model):
    name = models.CharField(max_length=100, unique=True, help_text="Ej: Inicio, Planificación y Estimación")
    tailwind_bg_color = models.CharField(max_length=50, default='bg-gray-200', help_text="Clase de Tailwind para el fondo del footer. Ej: bg-sky-100")
    tailwind_text_color = models.CharField(max_length=50, default='text-gray-600', help_text="Clase de Tailwind para el texto del footer. Ej: text-sky-800")
    
    class Meta:
        verbose_name = "Scrum Phase"
        verbose_name_plural = "Scrum Phases"

    def __str__(self):
        return self.name

# --- Modelo para los Procesos del PMBOK (ACTUALIZADO) ---
class PMBOKProcess(models.Model):
    KANBAN_STATUS_CHOICES = [
        ('unassigned', 'No Asignado'),
        ('backlog', 'Pendiente'),
        ('todo', 'Por Hacer'),
        ('in_progress', 'En Progreso'),
        ('in_review', 'En Revisión'),
        ('done', 'Hecho'),
    ]

    process_number = models.IntegerField(unique=True)
    name = models.CharField(max_length=255)
    
    status = models.ForeignKey(ProcessStatus, on_delete=models.SET_NULL, null=True, blank=True, related_name='pmbok_processes')
    stage = models.ForeignKey(ProcessStage, on_delete=models.SET_NULL, null=True, blank=True, related_name='pmbok_processes')
    
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


# --- Modelo para los Procesos de SCRUM (ACTUALIZADO) ---
class ScrumProcess(models.Model):
    process_number = models.IntegerField(unique=True)
    name = models.CharField(max_length=255)
    
    # Reutilizamos el modelo de Estatus que ya existe
    status = models.ForeignKey(ProcessStatus, on_delete=models.SET_NULL, null=True, blank=True, related_name='scrum_processes_by_status')
    
    # CAMBIO: Usamos el nuevo modelo ScrumPhase en lugar de ProcessStage
    phase = models.ForeignKey(ScrumPhase, on_delete=models.SET_NULL, null=True, blank=True, related_name='scrum_processes_by_phase')
    
    inputs = models.TextField(blank=True, help_text="Lista de entradas, separadas por saltos de línea.")
    tools_and_techniques = models.TextField(blank=True, help_text="Lista de herramientas y técnicas, separadas por saltos de línea.")
    outputs = models.TextField(blank=True, help_text="Lista de salidas, separadas por saltos de línea.")

    class Meta:
        ordering = ['process_number']
        verbose_name = "Scrum Process"
        verbose_name_plural = "Scrum Processes"

    def __str__(self):
        return f"{self.process_number}. {self.name}"
