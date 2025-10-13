# backend/api/serializers.py
from rest_framework import serializers
from .models import (
    Task, CustomUser, PMBOKProcess, ProcessStatus, ProcessStage,
    ScrumProcess, ScrumPhase, PMBOKProcessCustomization, ScrumProcessCustomization,
    Department
)
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# --- Serializadores de autenticación y soporte ---

# ===== INICIO: NUEVO SERIALIZER PARA TOKEN PERSONALIZADO =====
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Añadir claims personalizados
        token['email'] = user.email
        token['first_name'] = user.first_name

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Añadir datos extra a la respuesta del token
        data['two_fa_enabled'] = self.user.two_fa_enabled
        data['email'] = self.user.email
        data['first_name'] = self.user.first_name
        data['last_name'] = self.user.last_name

        return data
# ===== FIN: NUEVO SERIALIZER =====

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ('email', 'first_name', 'last_name', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Las contraseñas no coinciden."})
        return attrs

    def create(self, validated_data):
        # Eliminamos password2 para que no se pase al modelo
        validated_data.pop('password2')
        
        # Extraemos la contraseña para pasarla como argumento a create_user
        password = validated_data.pop('password')

        # Creamos el usuario con los datos restantes y la contraseña.
        # El método create_user ya se encarga de hashear y guardar.
        user = CustomUser.objects.create_user(password=password, **validated_data)
        
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


# ===== INICIO: NUEVOS SERIALIZADORES PARA DEPARTAMENTOS JERÁRQUICOS =====
class SubDepartmentSerializer(serializers.ModelSerializer):
    """Un serializer simple solo para mostrar subdepartamentos anidados."""
    class Meta:
        model = Department
        fields = ('id', 'name', 'tailwind_border_color')

class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer completo para Departamentos, maneja la jerarquía."""
    sub_departments = SubDepartmentSerializer(many=True, read_only=True)
    parent = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        allow_null=True,
        required=False
    )

    class Meta:
        model = Department
        fields = (
            'id',
            'name',
            'description',
            'tailwind_border_color',
            'parent',
            'sub_departments'
        )
# ===== FIN: NUEVOS SERIALIZADORES =====


class PMBOKProcessCustomizationSerializer(serializers.ModelSerializer):
    department = SubDepartmentSerializer(read_only=True)

    class Meta:
        model = PMBOKProcessCustomization
        fields = ('id', 'country_code', 'inputs',
                  'tools_and_techniques', 'outputs', 'kanban_status', 'department')


class ScrumProcessCustomizationSerializer(serializers.ModelSerializer):
    department = SubDepartmentSerializer(read_only=True)

    class Meta:
        model = ScrumProcessCustomization
        fields = ('id', 'country_code', 'inputs',
                  'tools_and_techniques', 'outputs', 'kanban_status', 'department')


# --- SERIALIZADORES DE PROCESOS PRINCIPALES ---

class PMBOKProcessSerializer(serializers.ModelSerializer):
    status = ProcessStatusSerializer(read_only=True)
    stage = ProcessStageSerializer(read_only=True)
    customizations = PMBOKProcessCustomizationSerializer(many=True, read_only=True)

    class Meta:
        model = PMBOKProcess
        fields = (
            'id', 'process_number', 'name', 'status', 'stage', 'kanban_status',
            'inputs', 'tools_and_techniques', 'outputs', 'customizations'
        )


class ScrumProcessSerializer(serializers.ModelSerializer):
    status = ProcessStatusSerializer(read_only=True)
    phase = ScrumPhaseSerializer(read_only=True)
    customizations = ScrumProcessCustomizationSerializer(many=True, read_only=True)

    class Meta:
        model = ScrumProcess
        fields = (
            'id', 'process_number', 'name', 'status', 'phase', 'kanban_status',
            'inputs', 'tools_and_techniques', 'outputs', 'customizations'
        )


class CustomizationWriteSerializer(serializers.Serializer):
    process_id = serializers.IntegerField(write_only=True)
    process_type = serializers.ChoiceField(
        choices=['pmbok', 'scrum'], write_only=True)
    country_code = serializers.CharField(max_length=2)
    inputs = serializers.JSONField()
    tools_and_techniques = serializers.JSONField()
    outputs = serializers.JSONField()
    department_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    def create(self, validated_data):
        process_type_str = validated_data.pop('process_type')
        process_id = validated_data.pop('process_id')
        department_id = validated_data.pop('department_id', None)

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
            raise serializers.ValidationError(
                "El proceso con el ID y tipo especificados no existe.")

        instance, created = customization_model.objects.update_or_create(
            process=process_instance,
            country_code=validated_data.get('country_code'),
            department_id=department_id,
            defaults={
                'inputs': validated_data.get('inputs'),
                'tools_and_techniques': validated_data.get('tools_and_techniques'),
                'outputs': validated_data.get('outputs'),
                'department_id': department_id
            }
        )
        return instance


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'