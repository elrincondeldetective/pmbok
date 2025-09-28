# backend/api/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
import json

from .models import CustomUser, Task, ProcessStatus, ProcessStage, PMBOKProcess, ScrumProcess, ScrumPhase

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('email', 'first_name', 'last_name', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

@admin.register(ProcessStatus)
class ProcessStatusAdmin(admin.ModelAdmin):
    list_display = ('name', 'tailwind_bg_color', 'tailwind_text_color', 'description')

@admin.register(ProcessStage)
class ProcessStageAdmin(admin.ModelAdmin):
    list_display = ('name', 'tailwind_bg_color', 'tailwind_text_color')
    search_fields = ('name',)

@admin.register(ScrumPhase)
class ScrumPhaseAdmin(admin.ModelAdmin):
    list_display = ('name', 'tailwind_bg_color', 'tailwind_text_color')
    search_fields = ('name',)

# --- CAMBIO: Admin para PMBOKProcess actualizado para manejar JSON ---
@admin.register(PMBOKProcess)
class PMBOKProcessAdmin(admin.ModelAdmin):
    list_display = ('process_number', 'name', 'status', 'stage', 'kanban_status')
    list_filter = ('status', 'stage', 'kanban_status')
    search_fields = ('name', 'process_number')
    list_editable = ('status', 'stage', 'kanban_status')
    
    # --- NUEVO: Campos para mostrar en el formulario de edición ---
    fieldsets = (
        ('Información Principal', {
            'fields': ('process_number', 'name', 'status', 'stage', 'kanban_status')
        }),
        ('Detalles del Proceso (ITTOs)', {
            'fields': ('inputs', 'tools_and_techniques', 'outputs'),
            'description': "Edite el JSON directamente. Cada item debe ser un objeto con 'name' (string) y 'url' (string, puede estar vacío)."
        }),
    )

# --- CAMBIO: Admin para ScrumProcess actualizado para manejar JSON ---
@admin.register(ScrumProcess)
class ScrumProcessAdmin(admin.ModelAdmin):
    list_display = ('process_number', 'name', 'status', 'phase')
    list_filter = ('status', 'phase',)
    search_fields = ('name', 'process_number')
    list_editable = ('status', 'phase',)

    # --- NUEVO: Campos para mostrar en el formulario de edición ---
    fieldsets = (
        ('Información Principal', {
            'fields': ('process_number', 'name', 'status', 'phase', 'kanban_status')
        }),
        ('Detalles del Proceso (ITTOs)', {
            'fields': ('inputs', 'tools_and_techniques', 'outputs'),
            'description': "Edite el JSON directamente. Cada item debe ser un objeto con 'name' (string) y 'url' (string, puede estar vacío)."
        }),
    )

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Task)
