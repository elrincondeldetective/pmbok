# /webapps/erd-ecosystem/apps/pmbok/backend/api/tests.py
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from api.models import (
    CustomUser, PMBOKProcess, PMBOKProcessCustomization,
    ProcessStatus, ProcessStage, Department
)


class PMBOKProcessTests(APITestCase):
    def setUp(self):
        # 1. Crear Usuario y Autenticar
        self.user = CustomUser.objects.create_user(
            email='test@test.com', password='password123')
        self.client.force_authenticate(user=self.user)

        # 2. Crear Datos Maestros (Status, Stage, Department)
        self.status = ProcessStatus.objects.create(
            name="Status Test", tailwind_bg_color="bg-red-500")
        self.stage = ProcessStage.objects.create(name="Stage Test")
        self.dept = Department.objects.create(name="IT Department")

        # 3. Crear Proceso Base
        self.process = PMBOKProcess.objects.create(
            process_number=1,
            name="Test Process",
            status=self.status,
            stage=self.stage,
            inputs=[{"name": "Input Base A", "url": ""}],
            tools_and_techniques=[],
            outputs=[]
        )

        # 4. Crear Personalización para Colombia (CO)
        PMBOKProcessCustomization.objects.create(
            process=self.process,
            country_code="CO",
            department=self.dept,
            # Sobrescribe lógica en Frontend
            inputs=[{"name": "Input Custom CO", "url": ""}],
            tools_and_techniques=[],
            outputs=[]
        )

    def test_get_process_details_authenticated(self):
        """
        Debe devolver el proceso base Y la lista de personalizaciones.
        """
        url = f'/api/pmbok-processes/{self.process.id}/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Validar datos base
        self.assertEqual(response.data['process_number'], 1)
        self.assertEqual(response.data['inputs'][0]['name'], "Input Base A")

        # Validar que vienen las personalizaciones
        self.assertTrue(len(response.data['customizations']) > 0)
        customization = response.data['customizations'][0]
        self.assertEqual(customization['country_code'], "CO")
        self.assertEqual(customization['inputs'][0]['name'], "Input Custom CO")

    def test_get_process_unauthenticated(self):
        """
        Debe rechazar usuarios anónimos (401 Unauthorized).
        """
        self.client.logout()
        url = f'/api/pmbok-processes/{self.process.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
