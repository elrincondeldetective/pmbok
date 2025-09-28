// frontend/src/components/scrum/ScrumSection.tsx
import React, { useState, useMemo } from 'react';
import type { IScrumProcess } from '../../types/process';
import SectionHeader from '../common/SectionHeader';
import ScrumGrid from './ScrumGrid';
import ScrumFilterLegend from './ScrumFilterLegend';

// El componente ahora recibe los procesos como props
interface ScrumSectionProps {
    processes: IScrumProcess[];
}

const ScrumSection: React.FC<ScrumSectionProps> = ({ processes }) => {
    // La lógica para cargar datos se ha movido al Contexto.
    // Este componente ahora solo se encarga de filtrar y mostrar.
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

    const handleStatusFilterClick = (statusName: string) => {
        setSelectedStatus(prev => (prev === statusName ? null : statusName));
    };
    
    const handlePhaseFilterClick = (phaseName: string) => {
        setSelectedPhase(prev => (prev === phaseName ? null : phaseName));
    };

    const clearFilters = () => {
        setSelectedStatus(null);
        setSelectedPhase(null);
    };

    // La lógica de filtrado ahora opera sobre los `processes` recibidos como props.
    const filteredScrumProcesses = useMemo(() => {
        return processes.filter(process => {
            const statusMatch = selectedStatus ? process.status?.name === selectedStatus : true;
            const phaseMatch = selectedPhase ? process.phase?.name === selectedPhase : true;
            return statusMatch && phaseMatch;
        });
    }, [processes, selectedStatus, selectedPhase]);

    return (
        <section>
            <SectionHeader
                title="Guía Scrum: Una visión adaptada a un entorno de trabajo ágil"
                subtitle="Filtrado por Fases de Trabajo y Grupos de Procesos"
            />
            <ScrumFilterLegend
                selectedStatus={selectedStatus}
                selectedPhase={selectedPhase}
                onStatusFilterClick={handleStatusFilterClick}
                onPhaseFilterClick={handlePhaseFilterClick}
                onClearFilters={clearFilters}
            />
            <ScrumGrid processes={filteredScrumProcesses} />
        </section>
    );
};

export default ScrumSection;
