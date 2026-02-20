# /webapps/erd-ecosystem/apps/pmbok/backend/api/views.py
import subprocess
from django.conf import settings
import os
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.http import JsonResponse
from rest_framework.permissions import IsAuthenticated


from .serializers import (
    TaskSerializer, UserRegistrationSerializer, PMBOKProcessSerializer,
    ScrumProcessSerializer, CustomizationWriteSerializer,
    PMBOKProcessCustomizationSerializer, ScrumProcessCustomizationSerializer,
    DepartmentSerializer,
    MyTokenObtainPairSerializer
)
from .models import (
    Task, CustomUser, PMBOKProcess, ScrumProcess, KANBAN_STATUS_CHOICES,
    PMBOKProcessCustomization, ScrumProcessCustomization,
    Department
)

# ===== INICIO: VISTA PERSONALIZADA PARA OBTENER TOKEN =====


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
# ===== FIN: VISTA PERSONALIZADA =====

# --- Vista de Registro ---


class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer

# ===== VISTAS 2FA =====


class TwoFASetupVerifyView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        code1 = request.data.get('code1')
        code2 = request.data.get('code2')
        if not email or not code1 or not code2:
            return Response({"error": "Faltan datos."}, status=status.HTTP_400_BAD_REQUEST)
        if code1 != settings.TWO_FA_CODE_REGISTRATION_1 or code2 != settings.TWO_FA_CODE_REGISTRATION_2:
            return Response({"error": "Códigos incorrectos."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = CustomUser.objects.get(email=email)
            user.two_fa_enabled = True
            user.save()
            return Response({"success": "2FA activado."}, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({"error": "Usuario no encontrado."}, status=status.HTTP_404_NOT_FOUND)


class TwoFALoginVerifyView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        code = request.data.get('code')
        if not code:
            return Response({"error": "Código requerido."}, status=status.HTTP_400_BAD_REQUEST)
        if code != settings.TWO_FA_CODE_LOGIN:
            return Response({"error": "Código incorrecto."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"success": "Verificado."}, status=status.HTTP_200_OK)

# ===== VISTA DEPARTAMENTOS =====


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

# --- VISTAS PROCESOS (Scrum/PMBOK) ---


class ScrumProcessViewSet(viewsets.ModelViewSet):
    queryset = ScrumProcess.objects.select_related(
        'status', 'phase').prefetch_related('customizations__department').all()
    serializer_class = ScrumProcessSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='bulk-update-kanban-status')
    def bulk_update_kanban_status(self, request):
        process_ids = request.data.get('process_ids')
        new_status = request.data.get('kanban_status')
        if not isinstance(process_ids, list) or not new_status:
            return Response({'error': 'Datos inválidos.'}, status=status.HTTP_400_BAD_REQUEST)
        ScrumProcessCustomization.objects.filter(
            process_id__in=process_ids).update(kanban_status=new_status)
        ScrumProcess.objects.filter(id__in=process_ids).update(
            kanban_status=new_status)
        return Response({'message': 'Actualizado exitosamente.'})


class PMBOKProcessViewSet(viewsets.ModelViewSet):
    queryset = PMBOKProcess.objects.select_related(
        'status', 'stage').prefetch_related('customizations__department').all()
    serializer_class = PMBOKProcessSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='bulk-update-kanban-status')
    def bulk_update_kanban_status(self, request):
        process_ids = request.data.get('process_ids')
        new_status = request.data.get('kanban_status')
        if not isinstance(process_ids, list) or not new_status:
            return Response({'error': 'Datos inválidos.'}, status=status.HTTP_400_BAD_REQUEST)
        PMBOKProcessCustomization.objects.filter(
            process_id__in=process_ids).update(kanban_status=new_status)
        PMBOKProcess.objects.filter(id__in=process_ids).update(
            kanban_status=new_status)
        return Response({'message': 'Actualizado exitosamente.'})


class CustomizationViewSet(viewsets.GenericViewSet):
    serializer_class = CustomizationWriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        if isinstance(instance, PMBOKProcessCustomization):
            response_serializer = PMBOKProcessCustomizationSerializer(instance)
        else:
            response_serializer = ScrumProcessCustomizationSerializer(instance)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='update-kanban-status')
    def update_kanban_status(self, request, pk=None):
        try:
            instance = PMBOKProcessCustomization.objects.get(pk=pk)
            model_type = 'pmbok'
        except PMBOKProcessCustomization.DoesNotExist:
            try:
                instance = ScrumProcessCustomization.objects.get(pk=pk)
                model_type = 'scrum'
            except ScrumProcessCustomization.DoesNotExist:
                return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('kanban_status')
        if not new_status:
            return Response({'error': 'Status required.'}, status=400)

        instance.kanban_status = new_status
        instance.save(update_fields=['kanban_status'])

        serializer = PMBOKProcessCustomizationSerializer(
            instance) if model_type == 'pmbok' else ScrumProcessCustomizationSerializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    queryset = Task.objects.all()
    permission_classes = [permissions.IsAuthenticated]

# ===== VISTA GIT HISTORY CORREGIDA (BLINDADA) =====


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_git_history(request):
    """
    Obtiene el historial de git. Si no hay carpeta .git (Docker prod),
    intenta leer variables de entorno inyectadas durante el build.
    """
    repo_dir = None

    # 1. Intentar buscar la carpeta .git (Lógica original)
    try:
        current_path = os.path.abspath(__file__)
        check_path = os.path.dirname(current_path)
        for _ in range(4):
            if os.path.exists(os.path.join(check_path, '.git')):
                repo_dir = check_path
                break
            check_path = os.path.dirname(check_path)
    except Exception:
        pass  # Fallo silencioso, pasamos al plan B

    # 2. Si NO se encontró repo_dir, usar Plan B (Variables de Entorno)
    if not repo_dir:
        # Variable inyectada desde Dockerfile/K8s
        commit_sha = os.environ.get('GIT_COMMIT_SHA', 'N/A')

        if commit_sha != 'N/A':
            print(
                f"⚠️ GIT: Carpeta .git no encontrada. Usando SHA de entorno: {commit_sha}")
            # Devolvemos un commit "sintético" para que el frontend no rompa
            return Response({"commits": [{
                "id": commit_sha[:7],  # Short SHA
                "parents": [],
                "author": "Build System",
                "message": f"Deployment Artifact ({commit_sha}) - History unavailable in container"
            }]})

        # Si todo falla
        print("❌ ERROR GIT: No hay carpeta .git ni variable GIT_COMMIT_SHA")
        return Response({
            "error": "Información de versión no disponible",
            "details": "El contenedor no tiene acceso al historial git."
        }, status=503)  # 503 Service Unavailable es más semántico que 500

    # 3. Si SÍ hay repo, ejecutar comando git (Lógica original mejorada)
    try:
        print(f"✅ GIT: Repositorio encontrado en: {repo_dir}")
        delimiter = "||||"
        cmd = [
            "git", "log", "--all",
            f"--pretty=format:%h{delimiter}%p{delimiter}%an{delimiter}%s",
            "-n", "100"
        ]

        result = subprocess.run(
            cmd, cwd=repo_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )

        if result.returncode != 0:
            raise Exception(result.stderr)

        commits = []
        lines = result.stdout.strip().split('\n')
        for line in lines:
            if not line.strip():
                continue
            parts = line.split(delimiter)
            if len(parts) >= 4:
                commits.append({
                    "id": parts[0],
                    "parents": parts[1].split() if parts[1] else [],
                    "author": parts[2],
                    "message": parts[3]
                })

        return Response({"commits": commits})

    except Exception as e:
        print(f"❌ ERROR EJECUCIÓN GIT: {str(e)}")
        # Fallback de último recurso
        return Response({"commits": [{
            "id": "unknown",
            "parents": [],
            "author": "System",
            "message": "Error retrieving git logs"
        }]})
