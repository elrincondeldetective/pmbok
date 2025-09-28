// frontend/src/data/scrumLegendData.ts

/**
 * Define los datos para la leyenda de estatus de Scrum.
 * Dado que todos los procesos de Scrum en el backend tienen un único estatus ("Aplicable en Scrum"),
 * esta sección es principalmente para fines de visualización.
 */
export const scrumStatusLegendData = [
  { name: 'Aplicable en Scrum', color: 'bg-sky-700', description: 'Proceso que forma parte del marco de trabajo Scrum.' },
];

/**
 * Define los datos para la leyenda y el filtro de las fases de Scrum.
 * Estos datos se utilizan para generar los botones de filtro interactivos.
 */
export const scrumPhaseLegendData = [
  { name: 'Inicio', color: 'bg-sky-100 text-sky-800' },
  { name: 'Planificación y Estimación', color: 'bg-amber-100 text-amber-800' },
  { name: 'Implementación', color: 'bg-green-100 text-green-800' },
  { name: 'Revisión y Retrospectiva', color: 'bg-indigo-100 text-indigo-800' },
  { name: 'Lanzamiento', color: 'bg-rose-100 text-rose-800' },
  { name: 'Scrum para grandes proyectos', color: 'bg-slate-200 text-slate-800' },
  { name: 'Scrum para la empresa', color: 'bg-violet-200 text-violet-800' },
];
