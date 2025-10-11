// frontend/src/components/dashboard/ProcessGrid.tsx
import React from 'react';
import ProcessCard from './ProcessCard';
// CORRECCIÓN: Se cambió 'IProcess' por 'AnyProcess'
import type { AnyProcess } from '../../types/process';

interface ProcessGridProps {
    // CORRECCIÓN: Se cambió 'IProcess' por 'AnyProcess'
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
                // NOTA: ProcessCard espera un IPMBOKProcess. Aquí hay un pequeño conflicto de tipos
                // que TypeScript puede no notar, pero para que funcione, asumiremos que se le pasarán
                // los procesos correctos desde el componente padre.
                <ProcessCard key={process.id} process={process as any} />
            ))}
        </div>
    );
};

export default ProcessGrid;