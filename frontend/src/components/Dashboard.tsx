// frontend/src/components/Dashboard.tsx
import React, { useState, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import DashboardNav from './dashboard/DashboardNav.tsx';
import SectionHeader from '../components/common/SectionHeader.tsx';
import FilterLegend from './dashboard/FilterLegend.tsx';
import KanbanBoard from './dashboard/KanbanBoard.tsx';
import ScrumSection from './scrum/ScrumSection.tsx';
import PMBOKSection from './pmbok/PMBOKSection.tsx';
import SprintControlPanel from './dashboard/SprintControlPanel.tsx';

import { ProcessContext } from '../context/ProcessContext.tsx';
import type { IPMBOKProcess, IScrumProcess } from '../types/process.ts';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    
    const { processes, loading, error, selectedCountry } = useContext(ProcessContext);
    
    const [selectedPmbokStatus, setSelectedPmbokStatus] = useState<string | null>(null);
    const [selectedPmbokStage, setSelectedPmbokStage] = useState<string | null>(null);

    // ===== LÓGICA DE FILTRADO CORREGIDA =====

    // 1. Procesos para el tablero Kanban, filtrados por el país seleccionado en el lado del cliente.
    const displayedKanbanProcesses = useMemo(() => {
        const allKanbanProcesses = processes?.filter(p => p.kanban_status !== 'unassigned') || [];
        
        // Si no hay país seleccionado en el filtro global ("Todos los países"),
        // devolvemos todas las tarjetas del Kanban.
        if (!selectedCountry) {
            return allKanbanProcesses;
        }

        // Si hay un país seleccionado, filtramos para mostrar solo las tarjetas del Kanban
        // que tienen una personalización para ese país específico.
        return allKanbanProcesses.filter(p => 
            p.customizations.some(c => c.country_code === selectedCountry.code)
        );
    }, [processes, selectedCountry]);

    // 2. Procesos para las secciones inferiores (sin cambios).
    const pmbokProcessesForGrid = useMemo(() => {
        return (processes?.filter(p => p.type === 'pmbok') as IPMBOKProcess[]) || [];
    }, [processes]);
    
    const scrumProcessesForGrid = useMemo(() => {
        return (processes?.filter(p => p.type === 'scrum') as IScrumProcess[]) || [];
    }, [processes]);

    // 3. Filtrado local de PMBOK (sin cambios).
    const filteredPmbokProcesses = useMemo(() => {
        return pmbokProcessesForGrid.filter(process => {
            const statusMatch = selectedPmbokStatus ? process.status?.name === selectedPmbokStatus : true;
            const stageMatch = selectedPmbokStage ? process.stage?.name?.startsWith(selectedPmbokStage) : true;
            return statusMatch && stageMatch;
        });
    }, [pmbokProcessesForGrid, selectedPmbokStatus, selectedPmbokStage]);

    // ===== FIN DE LA LÓGICA DE FILTRADO =====

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
                    
                    {loading && <div className="text-center text-gray-700 py-10">Cargando procesos...</div>}
                    {error && <div className="text-center text-red-600 font-semibold py-10">{error}</div>}
                    
                    {!loading && !error && (
                        <>
                            <SprintControlPanel />
                            <KanbanBoard initialProcesses={displayedKanbanProcesses} />
                            
                            <hr className="border-t-2 border-gray-300 border-dashed" />
                            
                            <ScrumSection processes={scrumProcessesForGrid} />
                    
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
