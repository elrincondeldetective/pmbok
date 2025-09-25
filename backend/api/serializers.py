# backend/api/serializers.py
from rest_framework import serializers
from .models import Task, CustomUser, PMBOKProcess, ProcessState # Importar nuevos modelos
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

# --- NUEVO: Serializers para los nuevos modelos ---
class ProcessStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessState
        fields = ('name', 'tailwind_bg_color', 'tailwind_text_color')

class PMBOKProcessSerializer(serializers.ModelSerializer):
    state = ProcessStateSerializer(read_only=True) # Serializador anidado

    class Meta:
        model = PMBOKProcess
        # --- CAMPOS ACTUALIZADOS ---
        fields = ('id', 'process_number', 'name', 'state', 'inputs', 'tools_and_techniques', 'outputs')
        # -----------------------------


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

