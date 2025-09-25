# backend/api/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
# CAMBIO 1: Importar los modelos con sus nuevos nombres y el nuevo modelo
from .models import CustomUser, Task, ProcessStatus, ProcessStage, PMBOKProcess

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

# CAMBIO 2: Renombrar ProcessStateAdmin a ProcessStatusAdmin
@admin.register(ProcessStatus)
class ProcessStatusAdmin(admin.ModelAdmin):
    list_display = ('name', 'tailwind_bg_color', 'tailwind_text_color', 'description')

# CAMBIO 3: Registrar el nuevo modelo ProcessStage
@admin.register(ProcessStage)
class ProcessStageAdmin(admin.ModelAdmin):
    list_display = ('name', 'tailwind_bg_color', 'tailwind_text_color')

# CAMBIO 4: Actualizar PMBOKProcessAdmin para incluir la etapa
@admin.register(PMBOKProcess)
class PMBOKProcessAdmin(admin.ModelAdmin):
    list_display = ('process_number', 'name', 'status', 'stage') # Añadir 'stage'
    list_filter = ('status', 'stage',) # Añadir 'stage'
    search_fields = ('name', 'process_number')
    list_editable = ('status', 'stage',) # Añadir 'stage' para editar en la lista

# Registros finales
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Task)
