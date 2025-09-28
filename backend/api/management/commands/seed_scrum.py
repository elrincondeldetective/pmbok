# backend/api/management/commands/seed_scrum.py
from django.core.management.base import BaseCommand
from api.models import ProcessStatus, ScrumPhase, ScrumProcess

class Command(BaseCommand):
    help = 'Seeds the database with the 27 Scrum processes'

    def handle(self, *args, **options):
        self.stdout.write('Deleting existing Scrum data...')
        ScrumProcess.objects.all().delete()
        ScrumPhase.objects.all().delete()

        # --- Estatus y Fases de Scrum con sus colores correctos ---
        
        status_scrum, _ = ProcessStatus.objects.get_or_create(
            name="Aplicable en Scrum", 
            defaults={'tailwind_bg_color': 'bg-sky-700', 'tailwind_text_color': 'text-white'}
        )

        self.stdout.write('Creating Scrum phases...')
        phase_inicio, _ = ScrumPhase.objects.get_or_create(
            name="Inicio", 
            defaults={'tailwind_bg_color': 'bg-sky-100', 'tailwind_text_color': 'text-sky-800'}
        )
        phase_plan, _ = ScrumPhase.objects.get_or_create(
            name="Planificación y Estimación", 
            defaults={'tailwind_bg_color': 'bg-amber-100', 'tailwind_text_color': 'text-amber-800'}
        )
        phase_impl, _ = ScrumPhase.objects.get_or_create(
            name="Implementación", 
            defaults={'tailwind_bg_color': 'bg-green-100', 'tailwind_text_color': 'text-green-800'}
        )
        phase_retro, _ = ScrumPhase.objects.get_or_create(
            name="Revisión y Retrospectiva", 
            defaults={'tailwind_bg_color': 'bg-indigo-100', 'tailwind_text_color': 'text-indigo-800'}
        )
        phase_lanz, _ = ScrumPhase.objects.get_or_create(
            name="Lanzamiento", 
            defaults={'tailwind_bg_color': 'bg-rose-100', 'tailwind_text_color': 'text-rose-800'}
        )
        phase_grandes_proyectos, _ = ScrumPhase.objects.get_or_create(
            name="Scrum para grandes proyectos",
            defaults={'tailwind_bg_color': 'bg-slate-200', 'tailwind_text_color': 'text-slate-800'}
        )
        phase_empresa, _ = ScrumPhase.objects.get_or_create(
            name="Scrum para la empresa",
            defaults={'tailwind_bg_color': 'bg-violet-200', 'tailwind_text_color': 'text-violet-800'}
        )

        # --- Datos de los 27 Procesos de Scrum ---
        scrum_processes_data = [
            # Fase 1: Inicio
            (1, "Crear la visión del proyecto", "Caso de negocio del proyecto\nProgram Product Owner\nProgram Scrum Master\nProgram Stakeholder(s)\nProgram Product Backlog\nProyecto de prueba\nPrueba del concepto\nVisión de la empresa\nMisión de la empresa\nEstudio del mercado\nRecomendaciones del Scrum Guidance Body", "Reunión de visión del proyecto\nSesiones JAD\nAnálisis FODA\nAnálisis de brecha", "Product Owner identificado*\nDeclaración de la visión del proyecto*\nActa constitutiva del proyecto\nPresupuesto del proyecto", phase_inicio),
            (2, "Identificar al Scrum Master y stakeholder(s)", "Product Owner*\nDeclaración de la visión del proyecto*\nRequisitos de las personas\nProgram Scrum Master\nProgram Stakeholder(s)\nRequerimientos de las personas\nDisponibilidad y compromiso de las personas\nMatriz de recursos organizacionales\nMatriz de las destrezas requeridas\nRecomendaciones del Scrum Guidance Body", "Criterios de selección*\nAsesoramiento de expertos en recursos humanos\nCapacitación y costos de capacitación\nCostos de recursos", "Scrum Master identificado*\nStakeholder(s) identificado", phase_inicio),
            (3, "Formar el Equipo Scrum", "Product Owner*\nScrum Master*\nDeclaración de la visión del proyecto*\nRequisitos de las personas\nDisponibilidad y compromiso de las personas\nMatriz de recurso organizacional\nMatriz de las destrezas requeridas\nRequerimientos de recursos\nRecomendaciones del Scrum Guidance Body", "Selección del equipo Scrum*\nAsesoramiento de expertos en recursos humanos\nCostos del personal\nCapacitación y costos de capacitación\nCostos de recursos", "Equipo Scrum identificado*\nSubstitutos\nPlan de colaboración\nPlan de formación del equipo", phase_inicio),
            (4, "Desarrollar épica(s)", "Equipo Principal de Scrum*\nDeclaración de la visión del proyecto*\nStakeholder(s)\nProgram Product Backlog\nSolicitudes de cambios aprobadas\nSolicitudes de cambios no aprobadas\nRiesgos del portafolio y del programa\nLeyes y regulaciones\nContratos aplicables\nInformación de proyectos previos\nRecomendaciones del Scrum Guidance Body", "Reuniones del grupo de usuarios*\nTalleres de historias de usuario\nReuniones del grupo de enfoque\nEntrevistas al usuario o cliente\nCuestionarios\nTécnicas de identificación de riesgos\nExperiencia del Scrum Guidance Body", "Épica(s)*\nPrototipos*\nCambios aprobados\nRiesgos identificados", phase_inicio),
            (5, "Crear el Backlog Priorizado del Producto", "Equipo principal de Scrum*\nÉpica(s)*\nPrototipos*\nStakeholder(s)\nDeclaración de la visión del proyecto\nProgram Product Backlog\nRequerimientos del negocio\nSolicitudes de cambios aprobadas\nRiesgos identificados\nContratos Aplicables\nRecomendaciones del Scrum Guidance Body", "Métodos de priorización de historias del usuario*\nTalleres de historias del usuario\nPlanificación de valor\nTécnicas de evaluación del riesgo\nEstimación del valor del proyecto\nMétodos de estimación de historias de usuario\nExperiencia Scrum Guidance Body", "Backlog Priorizado del Producto*\nCriterios de terminado*", phase_inicio),
            (6, "Realizar la planificación del lanzamiento", "Equipo principal de Scrum*\nStakeholder(s)*\nDeclaración de la visión del proyecto*\nBacklog Priorizado del Producto*\nCriterios de terminado*\nProgram Product Owner\nProgram Scrum Master\nProgram Product Backlog\nRequerimientos del negocio\nCalendario de días festivos\nRecomendaciones del Scrum Guidance Body", "Sesiones de planificación del lanzamiento*\nMétodos de priorización del lanzamiento*", "Cronograma de planificación del lanzamiento*\nDuración del sprint*\nClientes meta para el lanzamiento\nBacklog Priorizado del Producto refinado", phase_inicio),
            # Fase 2: Planificación y Estimación
            (7, "Crear historias de usuario", "Equipo principal de Scrum*\nBacklog Priorizado del Producto*\nCriterios de terminado*\nPrototipos*\nStakeholder(s)\nÉpica(s)\nRequerimientos del negocio\nLeyes y regulaciones\nContratos aplicables\nRecomendaciones del Scrum Guidance Body", "Experiencia en la redacción de historias de usuario*\nTalleres de historias del usuario\nReuniones del grupo de usuarios\nReuniones del grupo de enfoque\nEntrevistas al cliente o usuario\nCuestionarios\nExperiencia del Scrum Guidance Body", "Historias de usuarios*\nCriterios de aceptación de historias del usuario*\nBacklog Priorizado del Producto actualizado\nPrototipos actualizados o refinados", phase_plan),
            (8, "Estimar historias de usuario", "Equipo principal de Scrum*\nHistorias de usuarios*\nRecomendaciones del Scrum Guidance Body", "Reuniones de planificación del sprint\nReuniones de revisión del Backlog Priorizado del Producto\nMétodos de estimación*", "Historias del usuario estimadas*\nBacklog Priorizado del Producto actualizado\nCriterios de aceptación del usuario actualizado", phase_plan),
            (9, "Comprometer historias de usuario", "Equipo principal de Scrum*\nHistorias del usuario estimadas*\nDuración del sprint*\nVelocidad del sprint anterior\nRecomendaciones del Scrum Guidance Body", "Reuniones de planificación del sprint*\nTécnicas de comunicación", "Historias de usuario comprometidas*", phase_plan),
            (10, "Identificar tareas", "Equipo principal de Scrum*\nHistorias de usuario comprometidas*", "Reuniones de planificación del sprint*\nDescomposición\nDeterminación de dependencia", "Lista de tareas\nHistorias de usuario comprometidas actualizadas\nDependencias", phase_plan),
            (11, "Estimar tareas", "Equipo principal de Scrum*\nLista de tareas*\nCriterios de aceptación de historia de usuario\nDependencias\nRiesgos identificados\nRecomendaciones del Scrum Guidance Body", "Reuniones de planificación del sprint*\nCriterios de estimación*\nMétodos de estimación*", "Effort Estimated Task List*\nLista de tareas actualizada", phase_plan),
            (12, "Crear el Sprint Backlog", "Equipo principal de Scrum*\nEffort Estimated Task List*\nDuración del sprint*\nDependencias\nCalendario del equipo", "Reuniones de planificación del sprint*\nHerramientas de seguimiento del sprint\nParámetros de seguimiento del sprint", "Sprint Backlog*\nSprint Burndown Chart*", phase_plan),
            # Fase 3: Implementación
            (13, "Crear entregables", "Equipo principal de Scrum*\nSprint Backlog*\nScrumboard*\nImpediment Log*\nCronograma de planificación del lanzamiento\nDependencias\nRecomendaciones del Scrum Guidance Body", "Experiencia del equipo*\nSoftware\nOtras herramientas de desarrollo\nExperiencia del Scrum Guidance Body", "Entregables del sprint*\nScrumboard actualizado*\nImpediment Log actualizado*\nSolicitudes de cambios no aprobadas\nRiesgos identificados\nRiesgos mitigados\nDependencias actualizadas", phase_impl),
            (14, "Realizar Daily Standup", "Equipo Scrum*\nScrum Master*\nSprint Burndown Chart*\nImpediment Log*\nProduct Owner\nExperiencia del día anterior de trabajo\nScrumboard\nDependencias", "Daily Standup*\nTres preguntas diarias*\nWar Room\nVideoconferencia", "Sprint Burndown Chart actualizado*\nImpediment Log actualizado*\nEquipo Scrum motivado\nScrumboard actualizado\nSolicitud de cambios no aprobados\nRiesgos identificados\nRiesgos mitigados\nDependencias actualizadas", phase_impl),
            (15, "Refinamiento del Backlog Priorizado del Producto", "Equipo principal de Scrum*\nBacklog Priorizado del Producto*\nEntregables rechazados\nSolicitudes de cambios aprobados\nSolicitud de cambios rechazados\nRiesgos identificados\nProgram Product Backlog actualizado\nRegistro(s) de la retrospectiva del sprint\nDependencias\nCronograma de planificación del lanzamiento\nRecomendaciones del Scrum Guidance Body", "Reunión de revisión del Backlog Priorizado del Producto*\nTécnicas de comunicación\nOtras técnicas de refinamiento del Backlog Priorizado del Producto", "Backlog Priorizado del Producto actualizado*\nCronograma de planificación del lanzamiento actualizado", phase_impl),
            # Fase 4: Revisión y Retrospectiva
            (16, "Demostrar y validar el sprint", "Equipo principal de Scrum*\nEntregables del sprint*\nSprint Backlog*\nCriterios de terminado*\nCriterios de aceptación de las historias del usuario*\nStakeholder(s)\nCronograma de planificación del lanzamiento\nRiesgos identificados\nDependencias\nRecomendaciones Scrum Guidance Body", "Reuniones de revisión del Sprint*\nAnálisis del valor ganado\nExperiencia del Scrum Guidance Body", "Entregables aceptados*\nEntregables rechazados\nRiesgos actualizados\nResultados del análisis del valor ganado\nCronograma de planificación del lanzamiento actualizado\nDependencias actualizadas", phase_retro),
            (17, "Retrospectiva de sprint", "Scrum Master*\nEquipo Scrum*\nSalidas de Demostrar y validar el sprint*\nProduct Owner\nRecomendaciones del Scrum Guidance Body", "Reunión de retrospectiva del Sprint*\nFCVP\nSpeed Boat\nParámetros y técnicas de medición\nExperiencia del Scrum Guidance Body", "Agreed Actionable Improvements*\nAssigned Action items y fechas límite\nElementos no funcionales propuestos para el Backlog Priorizado del Producto\nRetrospect Sprint Log(s)\nLecciones aprendidas del equipo de Scrum\nRecomendaciones actualizadas del Scrum Guidance Body", phase_retro),
            # Fase 5: Lanzamiento
            (18, "Enviar entregables", "Product Owner*\nStakeholder(s)*\nEntregables aceptados*\nCronograma de planificación del lanzamiento*\nScrum Master\nEquipo Scrum\nCriterios de aceptación de las historias del usuario\nPlan de pilotaje\nRecomendaciones del Scrum Guidance Body", "Métodos de desplazamiento organizacional*\nPlan de comunicación", "Acuerdo de entregables funcionales*\nEntregables funcionales\nLanzamiento del producto", phase_lanz),
            (19, "Retrospectiva del proyecto", "Equipo principal de Scrum*\nChief Scrum Master\nChief Product Owner\nStakeholder(s)\nRecomendaciones del Scrum Guidance Body", "Reunión de la retrospectiva del proyecto*\nOtras HERRAMIENTAS para la retrospectiva del proyecto\nExperiencia del Scrum Guidance Body", "Agreed Actionable Improvements*\nAssigned Action items y fechas límite*\nElementos no funcionales propuestos para el Program Product Backlog y el Backlog Priorizado del Producto\nRecomendaciones del Scrum Guidance Body actualizadas", phase_lanz),
            # Fase 6: Scrum para Grandes Proyectos
            (20, "Crear componentes de grandes proyectos", "Declaración de la visión del proyecto*\nChief Product Owner*\nChief Scrum Master*\nIdentificar el ambiente*\nRecomendaciones del Scrum Guidance Body*\nProduct Owners\nScrum Masters\nOrganización de la empresa\nCaso de negocio\nProgram Scrum Master\nProgram Product Owner\nMatriz de recursos organizacionales", "Reunión de plan de ambiente*\nPlan de comunicación\nPlanificación de recursos de grandes proyectos\nDeterminación de dependencia", "Plan de preparación de lanzamiento*\nCriterios mínimos de terminado\nCriterios de aceptación de historias de usuario\nRecursos compartidos\nEspecialización del equipo\nMejoramientos recomendados del Scrum Guidance Body\nPlan de colaboración de Product Owners\nPlan de colaboración de equipos Scrum\nDependencias", phase_grandes_proyectos),
            (21, "Realizar y coordinar sprints", "Equipos principales*\nGrandes equipos principales*\nDefinición de terminado*\nCriterios de aceptación de historias de usuario*\nDependencias\nEnvironment Build Schedule\nPlan de preparación de lanzamiento*\nPlan de colaboración de equipos Scrum\nPlan de colaboración de Product Owners\nRecursos compartidos", "Reuniones de Scrum de Scrums*\nExperiencia del equipo*\nEnvironment Build Meeting", "Entregables del sprint*\nCronograma de planificación del lanzamiento actualizado*\nDependencias resueltas\nAmbiente creado", phase_grandes_proyectos),
            (22, "Preparar el lanzamiento de grandes proyectos", "Equipos principales*\nGrandes equipos principales*\nCronograma de planificación del lanzamiento*\nPlan de preparación de lanzamiento*", "Planes de comunicación*\nSprint de preparación de lanzamiento\nMétodos de preparación del lanzamiento", "Producto enviable*\nNotas de lanzamiento\nAmbiente de lanzamiento\nMejoramientos recomendados del Scrum Guidance Body", phase_grandes_proyectos),
            # Fase 7: Scrum para la Empresa
            (23, "Crear componentes de programa o portafolio", "Misión y visión de la compañía*\nPortfolio Product Owner*\nPortfolio Scrum Master*\nProgram Product Owner*\nProgram Scrum Master\nMatriz de recursos organizacionales\nRecomendaciones del Scrum Guidance Body\nStakeholders clave", "Planes de comunicación*\nPlanes de Recursos Humanos de la empresa*\nAnálisis de Stakeholder", "Criterios mínimos de terminado*\nCriterios de aceptación de historias de usuario*\nRecursos compartidos*\nStakeholders identificados*\nMejoramientos recomendados del Scrum Guidance Body", phase_empresa),
            (24, "Revisar y actualizar el Scrum Guidance Body", "Regulaciones*\nMejoramientos recomendados del Scrum Guidance Body*\nMiembros del Scrum Guidance Body", "Criterios de selección de miembros*\nBenchmarking\nReuniones del Scrum Guidance Body", "Recomendaciones actualizadas del Scrum Guidance Body*\nActionable Excitations\nMembresía actualizada del Scrum Guidance Body\nActualizaciones rechazadas a las recomendaciones del Scrum Guidance Body", phase_empresa),
            (25, "Crear y refinar el backlog del programa o portafolio", "Misión y visión de la compañía*\nPortfolio Backlog Priorizado*\nProgram Backlog Priorizado*\nPortfolio Product Owner*\nPortfolio Scrum Master*\nProgram Product Owner*\nProgram Scrum Master\nRecomendaciones del Scrum Guidance Body\nPolíticas de la empresa\nEstándares de la industria\nResultado de la evaluación/benchmarking", "Reuniones de revisión del Backlog Priorizado del Programa o el Portafolio\nTécnicas de comunicación*\nMétodos de priorización de historias de usuario\nTaller de historia de usuario\nEntrevistas con el usuario o cliente\nCuestionarios", "Backlog priorizado del programa o el portafolio actualizado*\nMejoramientos recomendados del Scrum Guidance Body*\nFechas límite de implementación actualizadas para los proyectos*\nPrototipos\nRiesgos identificados", phase_empresa),
            (26, "Coordinar los componentes del programa o portafolio", "Definición de terminado*\nDependencias conocidas*\nBacklog Priorizado del Programa o Portafolio*\nPortfolio Product Owner*\nPortfolio Scrum Master*\nProgram Product Owner*\nProgram Scrum Master*\nEntregables potencialmente enviables de los proyectos\nImpediments Logs\nBacklogs Priorizados del Producto\nLecciones aprendidas del equipo Scrum\nCronogramas de planificación del lanzamiento", "Reunión de Scrum de Scrums (SoS) y Scrum de Scrum de Scrums*\nTécnicas de comunicación", "Impediments Logs actualizados*\nDependencias actualizadas*\nMejoramientos recomendados del Scrum Guidance Body", phase_empresa),
            (27, "Retrospectiva de lanzamientos del programa o portafolio", "Portfolio Product Owner*\nPortfolio Scrum Master*\nProgram Product Owner*\nProgram Scrum Master*\nStakeholders\nRecomendaciones del Scrum Guidance Body", "Reunión de retrospectiva del programa o portafolio*\nExperiencia del Scrum Guidance Body", "Agreed Actionable Improvements*\nAssigned Action Items y fechas límite*\nMejoramientos recomendados del Scrum Guidance Body", phase_empresa),
        ]

        self.stdout.write('Seeding all 27 Scrum processes with complete data...')
        for num, name, inputs, tools, outputs, phase_obj in scrum_processes_data:
            ScrumProcess.objects.create(
                process_number=num,
                name=name,
                inputs=inputs,
                tools_and_techniques=tools,
                outputs=outputs,
                status=status_scrum,
                phase=phase_obj,
            )
        
        self.stdout.write(self.style.SUCCESS('All 27 Scrum processes have been seeded successfully with complete data!'))

