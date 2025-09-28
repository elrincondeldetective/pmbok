# backend/api/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
# CAMBIO 1: Importar los modelos, incluyendo el nuevo ScrumPhase
from .models import CustomUser, Task, ProcessStatus, ProcessStage, PMBOKProcess, ScrumProcess, ScrumPhase

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

# Admin para ProcessStatus (sin cambios)
@admin.register(ProcessStatus)
class ProcessStatusAdmin(admin.ModelAdmin):
    list_display = ('name', 'tailwind_bg_color', 'tailwind_text_color', 'description')

# Admin para ProcessStage (Áreas de Conocimiento PMBOK, sin cambios)
@admin.register(ProcessStage)
class ProcessStageAdmin(admin.ModelAdmin):
    list_display = ('name', 'tailwind_bg_color', 'tailwind_text_color')
    search_fields = ('name',)

# AÑADIDO: Registrar el nuevo modelo ScrumPhase para que aparezca en el admin
@admin.register(ScrumPhase)
class ScrumPhaseAdmin(admin.ModelAdmin):
    list_display = ('name', 'tailwind_bg_color', 'tailwind_text_color')
    search_fields = ('name',)

# Admin para PMBOKProcess (actualizado para mayor claridad)
@admin.register(PMBOKProcess)
class PMBOKProcessAdmin(admin.ModelAdmin):
    # CORRECCIÓN: 'stage' debe estar en list_display para ser editable.
    list_display = ('process_number', 'name', 'status', 'stage', 'kanban_status')
    list_filter = ('status', 'stage', 'kanban_status')
    search_fields = ('name', 'process_number')
    list_editable = ('status', 'stage', 'kanban_status')

    # El método @admin.display se elimina porque list_display ahora usa el campo directamente.
    # Django mostrará el nombre legible del campo "stage" automáticamente.

# CAMBIO: Actualizar ScrumProcessAdmin para usar 'phase' y ser más claro
@admin.register(ScrumProcess)
class ScrumProcessAdmin(admin.ModelAdmin):
    """
    Configuración para mostrar el modelo ScrumProcess en el panel de admin.
    """
    # CORRECCIÓN: 'phase' debe estar en list_display para ser editable.
    list_display = ('process_number', 'name', 'status', 'phase')
    
    # Opciones para filtrar en el panel lateral
    list_filter = ('status', 'phase',)
    
    # Campos por los que se puede buscar
    search_fields = ('name', 'process_number')
    
    # Campos que se pueden editar directamente desde la lista
    list_editable = ('status', 'phase',)

    # El método @admin.display se elimina.

# Registros finales
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Task)

