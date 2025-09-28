// frontend/src/components/Dashboard.tsx
import React, { useState, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// Componentes de UI
import DashboardNav from './dashboard/DashboardNav.tsx';
import SectionHeader from './common/SectionHeader.tsx';
import FilterLegend from './dashboard/FilterLegend.tsx';
import KanbanBoard from './dashboard/KanbanBoard.tsx';

// Componentes de Secciones
import ScrumSection from './scrum/ScrumSection.tsx';
import PMBOKSection from './pmbok/PMBOKSection.tsx';

// Contexto y Tipos
import { ProcessContext } from '../context/ProcessContext.tsx';
import type { IPMBOKProcess } from '../types/process.ts';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    
    // --- Lógica de estado y contexto para PMBOK (antes en PMBOKSection) ---
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

    // Procesos para el tablero Kanban (solo los que están asignados a una columna)
    const kanbanProcesses = useMemo(() => {
        const pmbokProcesses = processes as IPMBOKProcess[];
        return pmbokProcesses?.filter(p => p.kanban_status !== 'unassigned') || [];
    }, [processes]);

    // Procesos para la cuadrícula de tarjetas (afectada por los filtros de la leyenda)
    const filteredGridProcesses = useMemo(() => {
        if (!processes) return [];
        return (processes as IPMBOKProcess[]).filter(process => {
            const statusMatch = selectedStatus ? process.status?.name === selectedStatus : true;
            const stageMatch = selectedStage ? process.stage?.name?.startsWith(selectedStage) : true;
            return statusMatch && stageMatch;
        });
    }, [processes, selectedStatus, selectedStage]);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <DashboardNav onLogout={handleLogout} />
            <main>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">
                    <KanbanBoard initialProcesses={kanbanProcesses} />
                    {/* Sección de Scrum (sin cambios) */}
                    <ScrumSection />
            
                    <hr className="border-t-2 border-gray-300 border-dashed" />

                    {/* Nueva sección de PMBOK, ahora orquestada desde el Dashboard */}
                    <section>
                         <SectionHeader 
                            title="Guía PMBOK 6ª Edición – 49 Procesos"
                            subtitle="Una visión adaptada a un entorno de trabajo ágil."
                        />
                        {loading && <div className="text-center text-gray-700 py-10">Cargando datos de PMBOK...</div>}
                        {error && <div className="text-center text-red-600 font-semibold py-10">{error}</div>}
                        
                        {!loading && !error && (
                            <>
                                
                                <FilterLegend
                                    selectedStatus={selectedStatus}
                                    selectedStage={selectedStage}
                                    onStatusFilterClick={handleStatusFilterClick}
                                    onStageFilterClick={handleStageFilterClick}
                                    onClearFilters={clearFilters}
                                />
                                {/* PMBOKSection ahora solo renderiza las tarjetas, ya filtradas */}
                                <PMBOKSection processes={filteredGridProcesses} />
                            </>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;

