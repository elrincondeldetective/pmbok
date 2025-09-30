# backend/api/serializers.py
from rest_framework import serializers
from .models import (
    Task, CustomUser, PMBOKProcess, ProcessStatus, ProcessStage, 
    ScrumProcess, ScrumPhase, PMBOKProcessCustomization, ScrumProcessCustomization
)
from django.contrib.auth.password_validation import validate_password

# --- Serializadores de autenticación y soporte (SIN CAMBIOS) ---

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ('email', 'first_name', 'last_name', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        return attrs

    def create(self, validated_data):
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

class ScrumPhaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScrumPhase
        fields = ('name', 'tailwind_bg_color', 'tailwind_text_color')


# ===== INICIO: NUEVOS SERIALIZADORES PARA PERSONALIZACIONES (SOLO LECTURA) =====
# Se usarán para anidar los datos personalizados dentro de la respuesta de un proceso.

class PMBOKProcessCustomizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PMBOKProcessCustomization
        fields = ('id', 'country_code', 'inputs', 'tools_and_techniques', 'outputs')

class ScrumProcessCustomizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScrumProcessCustomization
        fields = ('id', 'country_code', 'inputs', 'tools_and_techniques', 'outputs')

# ===== FIN: NUEVOS SERIALIZADORES PARA PERSONALIZACIONES =====


# --- SERIALIZADORES DE PROCESOS PRINCIPALES (MODIFICADOS) ---

class PMBOKProcessSerializer(serializers.ModelSerializer):
    status = ProcessStatusSerializer(read_only=True)
    stage = ProcessStageSerializer(read_only=True)
    # Este campo se rellenará en la vista si existe una personalización para el país solicitado.
    customization = PMBOKProcessCustomizationSerializer(read_only=True, required=False)

    class Meta:
        model = PMBOKProcess
        # Se elimina 'country_code' y se añade 'customization' para la data anidada.
        fields = (
            'id', 'process_number', 'name', 'status', 'stage', 'kanban_status', 
            'inputs', 'tools_and_techniques', 'outputs', 'customization'
        )

class ScrumProcessSerializer(serializers.ModelSerializer):
    status = ProcessStatusSerializer(read_only=True)
    phase = ScrumPhaseSerializer(read_only=True)
    # Igual que en PMBOK, este campo es para la personalización por país.
    customization = ScrumProcessCustomizationSerializer(read_only=True, required=False)

    class Meta:
        model = ScrumProcess
        # Se elimina 'country_code' y se añade 'customization'.
        fields = (
            'id', 'process_number', 'name', 'status', 'phase', 'kanban_status',
            'inputs', 'tools_and_techniques', 'outputs', 'customization'
        )


# ===== INICIO: NUEVO SERIALIZADOR PARA CREAR/ACTUALIZAR PERSONALIZACIONES =====
# Este es el serializador que usará el nuevo endpoint para guardar los cambios del modal.

class CustomizationWriteSerializer(serializers.Serializer):
    process_id = serializers.IntegerField(write_only=True)
    process_type = serializers.ChoiceField(choices=['pmbok', 'scrum'], write_only=True)
    country_code = serializers.CharField(max_length=2)
    inputs = serializers.JSONField()
    tools_and_techniques = serializers.JSONField()
    outputs = serializers.JSONField()

    def create(self, validated_data):
        process_type_str = validated_data.pop('process_type')
        process_id = validated_data.pop('process_id')
        
        if process_type_str == 'pmbok':
            model_class = PMBOKProcess
            customization_model = PMBOKProcessCustomization
        elif process_type_str == 'scrum':
            model_class = ScrumProcess
            customization_model = ScrumProcessCustomization
        else:
            raise serializers.ValidationError("Tipo de proceso inválido.")

        try:
            process_instance = model_class.objects.get(pk=process_id)
        except model_class.DoesNotExist:
            raise serializers.ValidationError("El proceso con el ID y tipo especificados no existe.")

        instance, created = customization_model.objects.update_or_create(
            process=process_instance,
            country_code=validated_data.get('country_code'),
            defaults={
                'inputs': validated_data.get('inputs'),
                'tools_and_techniques': validated_data.get('tools_and_techniques'),
                'outputs': validated_data.get('outputs'),
            }
        )
        return instance

# ===== FIN: NUEVO SERIALIZADOR DE ESCRITURA =====


# --- Serializador de Tareas (SIN CAMBIOS) ---
class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'
