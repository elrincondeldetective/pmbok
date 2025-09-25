// frontend/tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  // Archivos que Tailwind debe escanear en busca de clases
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  
  // Aquí está la magia: clases que NUNCA deben ser purgadas
  safelist: [
    'bg-indigo-800',
    'bg-blue-700',
    'bg-green-600',
    'bg-amber-500',
    'bg-gray-400',
    'text-white',
    'text-gray-800'
  ],

  theme: {
    extend: {},
  },
  plugins: [],
}