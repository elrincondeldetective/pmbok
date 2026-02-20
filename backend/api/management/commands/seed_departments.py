# backend/api/management/commands/seed_departments.py
from django.core.management.base import BaseCommand
from api.models import Department

class Command(BaseCommand):
    help = 'Seeds the database with corporate departments and sub-departments'

    def handle(self, *args, **options):
        self.stdout.write('Deleting existing department data...')
        Department.objects.all().delete()

        self.stdout.write('Creating departments and sub-departments...')

        # Estructura jerárquica de los departamentos
        # Los subdepartamentos heredarán el color de su padre para consistencia visual
        departments_structure = {
            "Dirección General": {
                "color": "border-gray-500",
                "subs": [
                    "Estrategia y Desarrollo de Negocio",
                ]
            },
            "Finanzas": {
                "color": "border-yellow-500",
                "subs": [
                    "Contabilidad",
                ]
            },
            "Legal y Cumplimiento": {
                "color": "border-red-500",
                "subs": []
            },
            "Tecnología y Producto": {
                "color": "border-blue-500",
                "subs": [
                    "Gestión de Producto",
                    "Ingeniería / Desarrollo",
                    "Diseño (UX/UI)",
                    "Calidad (QA)",
                    "Operaciones de TI / DevOps",
                ]
            },
            "Crecimiento y Operaciones": {
                "color": "border-green-500",
                "subs": [
                    "Marketing",
                    "Ventas",
                    "Servicio al Cliente / Soporte",
                    "Operaciones de Negocio",
                ]
            },
            "Soporte Corporativo": {
                "color": "border-purple-500",
                "subs": [
                    "Recursos Humanos (RRHH)",
                    "Administración",
                ]
            },
        }

        parent_departments = {}

        # 1. Crear los departamentos de nivel superior (padres)
        for name, data in departments_structure.items():
            parent_obj, created = Department.objects.get_or_create(
                name=name,
                defaults={
                    'tailwind_border_color': data['color'],
                    'parent': None # Aseguramos que no tenga padre
                }
            )
            parent_departments[name] = parent_obj
            if created:
                self.stdout.write(f'  Created parent department: {name}')

        # 2. Crear los subdepartamentos y asignarlos a su padre
        for parent_name, data in departments_structure.items():
            parent_obj = parent_departments.get(parent_name)
            if not parent_obj:
                continue

            for sub_name in data['subs']:
                sub_obj, created = Department.objects.get_or_create(
                    name=sub_name,
                    defaults={
                        'parent': parent_obj,
                        'tailwind_border_color': data['color'] # Hereda el color del padre
                    }
                )
                if created:
                    self.stdout.write(f'    Created sub-department: {sub_name} under {parent_name}')


        self.stdout.write(self.style.SUCCESS('Database has been successfully seeded with departments!'))
