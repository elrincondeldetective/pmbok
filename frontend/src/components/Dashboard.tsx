// frontend/src/components/Dashboard.tsx
import React, { useState, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import DashboardNav from './dashboard/DashboardNav.tsx';
import SectionHeader from './common/SectionHeader.tsx';
import FilterLegend from './dashboard/FilterLegend.tsx';
import KanbanBoard from './dashboard/KanbanBoard.tsx';
import ScrumSection from './scrum/ScrumSection.tsx';
import PMBOKSection from './pmbok/PMBOKSection.tsx';

import { ProcessContext } from '../context/ProcessContext.tsx';
import type { AnyProcess, IPMBOKProcess, IScrumProcess } from '../types/process.ts';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    
    // Obtenemos la lista combinada de procesos desde el contexto unificado
    const { processes, loading, error } = useContext(ProcessContext);
    
    // Filtros para PMBOK
    const [selectedPmbokStatus, setSelectedPmbokStatus] = useState<string | null>(null);
    const [selectedPmbokStage, setSelectedPmbokStage] = useState<string | null>(null);

    // Procesos filtrados para el tablero Kanban (todos los que no están 'unassigned')
    const kanbanProcesses = useMemo(() => {
        return processes?.filter(p => p.kanban_status !== 'unassigned') || [];
    }, [processes]);

    // Procesos filtrados para la cuadrícula de PMBOK
    const filteredPmbokProcesses = useMemo(() => {
        return (processes?.filter(p => p.type === 'pmbok') as IPMBOKProcess[]).filter(process => {
            const statusMatch = selectedPmbokStatus ? process.status?.name === selectedPmbokStatus : true;
            const stageMatch = selectedPmbokStage ? process.stage?.name?.startsWith(selectedPmbokStage) : true;
            return statusMatch && stageMatch;
        });
    }, [processes, selectedPmbokStatus, selectedPmbokStage]);

    // Procesos filtrados para la sección de Scrum
    const scrumProcesses = useMemo(() => {
        return processes?.filter(p => p.type === 'scrum') as IScrumProcess[] || [];
    }, [processes]);


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
                    
                    {loading && <div className="text-center text-gray-700 py-10">Cargando todos los procesos...</div>}
                    {error && <div className="text-center text-red-600 font-semibold py-10">{error}</div>}
                    
                    {!loading && !error && (
                        <>
                            <KanbanBoard initialProcesses={kanbanProcesses} />
                            
                            <hr className="border-t-2 border-gray-300 border-dashed" />
                            
                            {/* ScrumSection ahora recibe los procesos de Scrum como prop */}
                            <ScrumSection processes={scrumProcesses} />
                    
                            <hr className="border-t-2 border-gray-300 border-dashed" />

                            <section>
                                 <SectionHeader 
                                    title="Guía PMBOK 6ª Edición – 49 Procesos"
                                    subtitle="Una visión adaptada a un entorno de trabajo ágil."
                                />
                                <FilterLegend
                                    selectedStatus={selectedPmbokStatus}
                                    selectedStage={selectedPmbokStage}
                                    onStatusFilterClick={(name) => setSelectedPmbokStatus(prev => prev === name ? null : name)}
                                    onStageFilterClick={(name) => setSelectedPmbokStage(prev => prev === name ? null : name)}
                                    onClearFilters={() => { setSelectedPmbokStatus(null); setSelectedPmbokStage(null); }}
                                />
                                <PMBOKSection processes={filteredPmbokProcesses} />
                            </section>
                        </>
                    )}

                </div>
            </main>
        </div>
    );
};

export default Dashboard;
