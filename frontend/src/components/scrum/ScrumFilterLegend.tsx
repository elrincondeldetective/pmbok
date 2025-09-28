// frontend/src/components/scrum/ScrumFilterLegend.tsx
import React from 'react';
import { scrumStatusLegendData, scrumPhaseLegendData } from '../../data/scrumLegendData';

interface ScrumFilterLegendProps {
  selectedPhase: string | null;
  onPhaseFilterClick: (phaseName: string) => void;
  onClearFilters: () => void;
}

const ScrumFilterLegend: React.FC<ScrumFilterLegendProps> = ({
  selectedPhase,
  onPhaseFilterClick,
  onClearFilters,
}) => {
  return (
    // Contenedor principal con estilos consistentes a la versión de PMBOK
    <div className="bg-white p-6 rounded-lg shadow-md mb-12">
      {/* Encabezado con título a la izquierda y botón a la derecha */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-gray-700">Leyenda y Filtros</h3>
        {selectedPhase && (
          <button
            onClick={onClearFilters}
            className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-1 px-3 rounded-full transition duration-200"
          >
            Limpiar Filtro
          </button>
        )}
      </div>
      {/* Cuadrícula de dos columnas para el contenido de la leyenda */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {/* Columna Izquierda: Estatus */}
        <div>
          <h4 className="font-semibold text-gray-600 mb-3">Estatus de Aplicabilidad</h4>
          <div className="space-y-2">
            {scrumStatusLegendData.map(item => (
              <div key={item.name} className="flex items-center">
                <span className={`w-5 h-5 rounded-full mr-3 ${item.color}`}></span>
                <span className="text-sm"><strong>{item.name}:</strong> {item.description}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Columna Derecha: Fases */}
        <div>
          <h4 className="font-semibold text-gray-600 mb-3">Fase del Proceso</h4>
          <div className="flex flex-wrap gap-2">
            {scrumPhaseLegendData.map(item => (
              <button
                key={item.name}
                className={`flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 ${item.color} ${selectedPhase === item.name ? 'ring-2 ring-offset-2 ring-blue-500' : 'hover:opacity-80'}`}
                onClick={() => onPhaseFilterClick(item.name)}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrumFilterLegend;


