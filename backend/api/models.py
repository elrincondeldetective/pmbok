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


# --- Modelo de Tareas (existente) ---
class Task(models.Model):
    title = models.CharField(max_length=200)
    completed = models.BooleanField(default=False, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

