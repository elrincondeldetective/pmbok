# backend/api/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Task, ProcessState, PMBOKProcess # Importar nuevos modelos

# Configuramos cómo se verá nuestro modelo CustomUser en el panel de admin.
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('email', 'first_name', 'last_name', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    
    # Campos que se mostrarán en el formulario de edición.
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

# --- NUEVO: Configuración para el Admin de los nuevos modelos ---
@admin.register(ProcessState)
class ProcessStateAdmin(admin.ModelAdmin):
    list_display = ('name', 'tailwind_bg_color', 'tailwind_text_color', 'description')

@admin.register(PMBOKProcess)
class PMBOKProcessAdmin(admin.ModelAdmin):
    list_display = ('process_number', 'name', 'state')
    list_filter = ('state',)
    search_fields = ('name', 'process_number')
    list_editable = ('state',) # Permite editar el estado directamente desde la lista


# Registramos los modelos.
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Task)

