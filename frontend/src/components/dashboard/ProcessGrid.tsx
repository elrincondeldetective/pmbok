// frontend/src/components/dashboard/ProcessGrid.tsx
import React from 'react';
import ProcessCard from './ProcessCard';
// CORRECCIÓN: Se cambió 'IProcess' por 'AnyProcess' para que coincida con los nuevos tipos de datos.
import type { AnyProcess, IPMBOKProcess } from '../../types/process';

interface ProcessGridProps {
    // CORRECCIÓN: Se cambió 'IProcess[]' por 'AnyProcess[]'
    processes: AnyProcess[];
}

const ProcessGrid: React.FC<ProcessGridProps> = ({ processes }) => {
    if (processes.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-600">No se encontraron procesos que coincidan con los filtros seleccionados.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            {processes.map((process) => (
                // El componente 'ProcessCard' espera un proceso de tipo PMBOK.
                // Aseguramos que el tipo sea el correcto al pasarlo.
                <ProcessCard key={process.id} process={process as IPMBOKProcess} />
            ))}
        </div>
    );
};

export default ProcessGrid;
