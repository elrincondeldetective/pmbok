# backend/api/serializers.py
from rest_framework import serializers
# CAMBIO 1: Importar modelos actualizados
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
        # Es importante usar set_password para hashear la contraseña
        user.set_password(validated_data['password'])
        user.save()
        return user

# CAMBIO 2: Renombrar a ProcessStatusSerializer
class ProcessStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessStatus
        fields = ('name', 'tailwind_bg_color', 'tailwind_text_color')

# CAMBIO 3: Crear el nuevo ProcessStageSerializer
class ProcessStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessStage
        fields = ('name', 'tailwind_bg_color', 'tailwind_text_color')

# CAMBIO 4: Actualizar PMBOKProcessSerializer
class PMBOKProcessSerializer(serializers.ModelSerializer):
    status = ProcessStatusSerializer(read_only=True) # Renombrar 'state' a 'status'
    stage = ProcessStageSerializer(read_only=True)  # Añadir el serializador para 'stage'

    class Meta:
        model = PMBOKProcess
        # Añadir 'stage' y renombrar 'state'
        fields = ('id', 'process_number', 'name', 'status', 'stage', 'inputs', 'tools_and_techniques', 'outputs')



# TaskSerializer (Sin cambios)
class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

