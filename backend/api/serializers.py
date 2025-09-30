# backend/api/serializers.py
from rest_framework import serializers
from .models import Task, CustomUser, PMBOKProcess, ProcessStatus, ProcessStage, ScrumProcess, ScrumPhase
from django.contrib.auth.password_validation import validate_password

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

# --- CAMBIO: El serializador ahora manejará automáticamente los campos JSON ---
# No se necesitan cambios explícitos aquí, pero es bueno saber que
# DRF serializará/deserializará los JSONFields correctamente.
class PMBOKProcessSerializer(serializers.ModelSerializer):
    status = ProcessStatusSerializer(read_only=True)
    stage = ProcessStageSerializer(read_only=True)

    class Meta:
        model = PMBOKProcess
        # ===== INICIO: CAMBIO SOLICITADO =====
        # Añadimos 'country_code' a los campos serializados.
        fields = ('id', 'process_number', 'name', 'status', 'stage', 'kanban_status', 'country_code', 'inputs', 'tools_and_techniques', 'outputs')
        # ===== FIN: CAMBIO SOLICITADO =====

class ScrumProcessSerializer(serializers.ModelSerializer):
    status = ProcessStatusSerializer(read_only=True)
    phase = ScrumPhaseSerializer(read_only=True)

    class Meta:
        model = ScrumProcess
        # ===== INICIO: CAMBIO SOLICITADO =====
        # Añadimos 'country_code' también aquí.
        fields = ('id', 'process_number', 'name', 'status', 'phase', 'kanban_status', 'country_code', 'inputs', 'tools_and_techniques', 'outputs')
        # ===== FIN: CAMBIO SOLICITADO =====

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

