/** @type {import('tailwindcss').Config} */
export default {
  // Archivos que Tailwind debe escanear en busca de clases
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  
  // Clases que NUNCA deben ser purgadas por Tailwind
  safelist: [
    // --- Colores para ESTATUS (Cabecera de la tarjeta PMBOK y Scrum) ---
    'bg-indigo-800',
    'bg-blue-700',
    'bg-green-600',
    'bg-amber-500',
    'bg-gray-400',
    'text-white',
    'text-gray-800',
    'bg-sky-700', // Estatus "Aplicable en Scrum"

    // --- Colores para ETAPAS PMBOK (Pie de página de la tarjeta) ---
    'bg-gray-200',
    'text-gray-700',
    'bg-purple-100',
    'text-purple-800',
    'bg-blue-100',
    'text-blue-800',
    'bg-cyan-100',
    'text-cyan-800',
    'bg-green-100',
    'text-green-800',
    'bg-red-100',
    'text-red-800',
    'bg-lime-100',
    'text-lime-800',
    'bg-rose-100',
    'text-rose-800',
    'bg-amber-100',
    'text-amber-800',
    'bg-orange-100',
    'text-orange-800',
    
    // --- Colores para FASES SCRUM (Pie de página de la tarjeta) ---
    'bg-sky-100',
    'text-sky-800',
    'bg-indigo-100',
    'text-indigo-800',
    'bg-slate-200',
    'text-slate-800',
    'bg-violet-200',
    'text-violet-800',
  ],

  theme: {
    extend: {},
  },
  plugins: [],
}
