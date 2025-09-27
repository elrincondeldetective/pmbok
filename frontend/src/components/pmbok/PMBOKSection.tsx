// frontend/src/components/pmbok/PMBOKSection.tsx
import React, { useMemo, useState, useContext } from 'react';
import { ProcessContext } from '../../context/ProcessContext.tsx';
import type { IPMBOKProcess } from '../../types/process';
import SectionHeader from '../common/SectionHeader.tsx';
import FilterLegend from '../dashboard/FilterLegend.tsx';
import PMBOKGrid from './PMBOKGrid.tsx';
import KanbanBoard from '../dashboard/KanbanBoard.tsx';

const PMBOKSection: React.FC = () => {
    const { processes, loading, error } = useContext(ProcessContext);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [selectedStage, setSelectedStage] = useState<string | null>(null);

    const handleStatusFilterClick = (statusName: string) => {
        setSelectedStatus(prev => (prev === statusName ? null : statusName));
    };

    const handleStageFilterClick = (stageName: string) => {
        setSelectedStage(prev => (prev === stageName ? null : stageName));
    };

    const clearFilters = () => {
        setSelectedStatus(null);
        setSelectedStage(null);
    };

    const filteredProcesses = useMemo(() => {
        // Aseguramos que el contexto está proveyendo los procesos de PMBOK
        const pmbokProcesses = processes as IPMBOKProcess[];
        if (!pmbokProcesses) return [];
        
        return pmbokProcesses.filter(process => {
            const statusMatch = selectedStatus ? process.status?.name === selectedStatus : true;
            const stageMatch = selectedStage ? process.stage?.name?.startsWith(selectedStage) : true;
            return statusMatch && stageMatch;
        });
    }, [processes, selectedStatus, selectedStage]);

    if (loading) {
        return <div className="text-center text-gray-700">Cargando procesos de PMBOK...</div>;
    }

    if (error) {
        return <div className="text-center text-red-600 font-semibold">{error}</div>;
    }

    return (
        <section>
            <SectionHeader 
                title="Guía PMBOK 6ª Edición – 49 Procesos"
                subtitle="Una visión adaptada a un entorno de trabajo ágil."
            />
             {processes && <KanbanBoard initialProcesses={processes as IPMBOKProcess[]} />}
            <FilterLegend
                selectedStatus={selectedStatus}
                selectedStage={selectedStage}
                onStatusFilterClick={handleStatusFilterClick}
                onStageFilterClick={handleStageFilterClick}
                onClearFilters={clearFilters}
            />
            <PMBOKGrid processes={filteredProcesses} />
        </section>
    );
};

export default PMBOKSection;

