// frontend/src/components/dashboard/ProcessGrid.tsx
import React from 'react';
import ProcessCard from './ProcessCard';
import type { IProcess } from '../../types/process';

interface ProcessGridProps {
    processes: IProcess[];
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
                <ProcessCard key={process.id} process={process} />
            ))}
        </div>
    );
};

export default ProcessGrid;
