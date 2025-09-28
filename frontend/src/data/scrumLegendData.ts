// frontend/src/data/scrumLegendData.ts

/**
 * Define los datos para la leyenda del ESTATUS DE FLUJO DE TRABAJO.
 * Estos estatus representan el "cuándo" se realiza una actividad en el ciclo de vida ágil.
 */
export const scrumStatusLegendData = [
  { name: 'Fase 0: Preparación 🚀', color: 'bg-purple-800', description: 'Actividades iniciales para establecer la visión y el marco del proyecto.' },
  { name: 'Ciclo del Sprint 🗓️', color: 'bg-blue-700', description: 'Ceremonias y procesos clave que ocurren en cada Sprint (ej. Planning, Review).' },
  { name: 'Ritmo Diario 🛠️', color: 'bg-green-600', description: 'Actividades recurrentes que impulsan el trabajo diario del equipo.' },
  { name: 'Lanzamiento y Cierre 🚢', color: 'bg-rose-700', description: 'Procesos para entregar valor y reflexionar sobre el proyecto en su conjunto.' },
  { name: 'Escalado Avanzado 🧘', color: 'bg-gray-500', description: 'Procesos para coordinar múltiples equipos o alinear con la empresa.' },
];

/**
 * Define los datos para la leyenda de la FASE DEL PROCESO (Grupo de Procesos de la guía).
 * Estos representan el "qué" o el área de enfoque del proceso.
 */
export const scrumPhaseLegendData = [
  { name: 'Inicio', color: 'bg-sky-100 text-sky-800' },
  { name: 'Planificación y Estimación', color: 'bg-amber-100 text-amber-800' },
  { name: 'Implementación', color: 'bg-green-100 text-green-800' },
  { name: 'Revisión y Retrospectiva', color: 'bg-indigo-100 text-indigo-800' },
  { name: 'Lanzamiento', color: 'bg-pink-100 text-pink-800' },
  { name: 'Scrum para grandes proyectos', color: 'bg-slate-200 text-slate-800' },
  { name: 'Scrum para la empresa', color: 'bg-violet-200 text-violet-800' },
];
