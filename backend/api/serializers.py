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
