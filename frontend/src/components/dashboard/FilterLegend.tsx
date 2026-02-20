// frontend/src/components/dashboard/FilterLegend.tsx
import React from 'react';
import { statusLegendData, stageLegendData } from '../../data/legendData';

interface FilterLegendProps {
    selectedStatus: string | null;
    selectedStage: string | null;
    onStatusFilterClick: (statusName: string) => void;
    onStageFilterClick: (stageName: string) => void;
    onClearFilters: () => void;
}

const FilterLegend: React.FC<FilterLegendProps> = ({
    selectedStatus,
    selectedStage,
    onStatusFilterClick,
    onStageFilterClick,
    onClearFilters,
}) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-12">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-700">Leyenda y Filtros</h3>
                {(selectedStatus || selectedStage) && (
                    <button
                        onClick={onClearFilters}
                        className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-1 px-3 rounded-full transition duration-200"
                    >
                        Limpiar Filtros
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                    <h4 className="font-semibold text-gray-600 mb-3">Estatus de Aplicabilidad</h4>
                    <div className="space-y-2">
                        {statusLegendData.map(item => (
                            <div
                                key={item.name}
                                className="flex items-center cursor-pointer group"
                                onClick={() => onStatusFilterClick(item.name)}
                            >
                                <span className={`w-5 h-5 rounded-full mr-3 transition-all duration-200 ${selectedStatus === item.name ? 'ring-2 ring-offset-2 ring-blue-500' : ''} ${item.color}`}></span>
                                <span className="text-sm group-hover:text-blue-600"><strong>{item.name}:</strong> {item.description}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-600 mb-3">Área de Conocimiento</h4>
                    <div className="flex flex-wrap gap-2">
                        {stageLegendData.map(item => (
                            <div
                                key={item.name}
                                className={`flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 ${item.color} ${selectedStage === item.name ? 'ring-2 ring-blue-500' : 'hover:opacity-80'}`}
                                onClick={() => onStageFilterClick(item.name)}
                            >
                                {item.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterLegend;
