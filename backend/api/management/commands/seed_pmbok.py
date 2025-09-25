# backend/api/management/commands/seed_pmbok.py
import os
from django.core.management.base import BaseCommand
from api.models import ProcessState, PMBOKProcess

class Command(BaseCommand):
    help = 'Seeds the database with PMBOK processes and their states'

    def handle(self, *args, **options):
        self.stdout.write('Deleting existing data...')
        PMBOKProcess.objects.all().delete()
        ProcessState.objects.all().delete()

        self.stdout.write('Creating process states...')

        # Crear los 5 estados
        state1, _ = ProcessState.objects.get_or_create(
            name="Base Estratégica", 
            defaults={'tailwind_bg_color': 'bg-indigo-800', 'tailwind_text_color': 'text-white'}
        )
        state2_biweekly, _ = ProcessState.objects.get_or_create(
            name="Ritmo de Sprint (2 Semanas)", 
            defaults={'tailwind_bg_color': 'bg-blue-700', 'tailwind_text_color': 'text-white'}
        )
        state2_daily, _ = ProcessState.objects.get_or_create(
            name="Ritmo Diario", 
            defaults={'tailwind_bg_color': 'bg-green-600', 'tailwind_text_color': 'text-white'}
        )
        state3, _ = ProcessState.objects.get_or_create(
            name="Burocracia Innecesaria", 
            defaults={'tailwind_bg_color': 'bg-amber-500', 'tailwind_text_color': 'text-white'}
        )
        state4, _ = ProcessState.objects.get_or_create(
            name="Inaplicable", 
            defaults={'tailwind_bg_color': 'bg-gray-400', 'tailwind_text_color': 'text-gray-800'}
        )

        # Diccionario de procesos por estado
        processes = {
            state1: [
                (1, "Desarrollar el Acta de Constitución del Proyecto"), (2, "Identificar a los Interesados"),
                (5, "Planificar la Gestión del Alcance"), (6, "Recopilar Requisitos"), (7, "Definir el Alcance"),
                (8, "Crear la EDT/WBS"), (9, "Planificar la Gestión del Cronograma"), (12, "Planificar la Gestión de los Riesgos"),
                (13, "Identificar los Riesgos"), (19, "Planificar la Gestión de los Costos"), (23, "Determinar el Presupuesto"),
            ],
            state2_biweekly: [
                (28, "Gestionar el Conocimiento del Proyecto"), (29, "Gestionar el Involucramiento de los Interesados"),
                (37, "Monitorear y Controlar el Trabajo del Proyecto"), (38, "Realizar el Control Integrado de Cambios"),
                (43, "Monitorear los Riesgos"), (45, "Controlar la Calidad"), (46, "Validar el Alcance"),
            ],
            state2_daily: [
                (27, "Dirigir y Gestionar el Trabajo del Proyecto"), (32, "Dirigir al Equipo"),
            ],
            state3: [
                (3, "Desarrollar el Plan para la Dirección del Proyecto"), (4, "Planificar el Involucramiento de los Interesados"),
                (10, "Definir las Actividades"), (11, "Secuenciar las Actividades"), (14, "Realizar el Análisis Cualitativo de Riesgos"),
                (16, "Planificar la Respuesta a los Riesgos"), (21, "Estimar la Duración de las Actividades"),
                (22, "Desarrollar el Cronograma"), (24, "Planificar la Gestión de la Calidad"),
                (25, "Planificar la Gestión de las Comunicaciones"), (31, "Desarrollar el Equipo"), (36, "Implementar la Respuesta a los Riesgos"),
            ],
            state4: [
                (15, "Realizar el Análisis Cuantitativo de Riesgos"), (17, "Planificar la Gestión de Recursos"),
                (18, "Estimar los Recursos de las Actividades"), (20, "Estimar los Costos"), (26, "Planificar la Gestión de las Adquisiciones"),
                (30, "Adquirir Recursos"), (34, "Efectuar las Adquisiciones"), (40, "Controlar el Cronograma"),
                (41, "Controlar los Costos"), (42, "Monitorear las Comunicaciones"), (44, "Controlar los Recursos"),
                (47, "Controlar el Alcance"), (48, "Controlar las Adquisiciones"), (49, "Cerrar el Proyecto o Fase"),
            ]
        }

        self.stdout.write('Seeding PMBOK processes...')
        for state, process_list in processes.items():
            for num, name in process_list:
                PMBOKProcess.objects.create(process_number=num, name=name, state=state)

        self.stdout.write(self.style.SUCCESS('Database has been seeded successfully!'))