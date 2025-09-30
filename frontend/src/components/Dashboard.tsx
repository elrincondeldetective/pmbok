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
    
    // `processes` es la lista maestra con todas las personalizaciones cargadas.
    // `selectedCountry` es el valor actual del filtro global.
    const { processes, loading, error, selectedCountry } = useContext(ProcessContext);
    
    const [selectedPmbokStatus, setSelectedPmbokStatus] = useState<string | null>(null);
    const [selectedPmbokStage, setSelectedPmbokStage] = useState<string | null>(null);

    // ===== LÓGICA DE FILTRADO CORRECTA =====

    // 1. Procesos para el tablero Kanban, filtrados por el país seleccionado.
    const displayedKanbanProcesses = useMemo(() => {
        // Primero, obtenemos solo los procesos que están en alguna columna del Kanban.
        const allKanbanProcesses = processes?.filter(p => p.kanban_status !== 'unassigned') || [];
        
        // Si no hay país seleccionado en el filtro global ("Todos los países"), 
        // devolvemos todas las tarjetas del Kanban.
        if (!selectedCountry) {
            return allKanbanProcesses;
        }

        // Si hay un país seleccionado, filtramos para mostrar solo las tarjetas del Kanban
        // que tienen una personalización para ese país específico.
        return allKanbanProcesses.filter(p => p.customization?.country_code === selectedCountry.code);
    }, [processes, selectedCountry]);

    // 2. Procesos para las secciones inferiores (PMBOK y Scrum), SIN FILTRO de país.
    const pmbokProcessesForGrid = useMemo(() => {
        // Esta lista siempre contiene TODOS los procesos PMBOK, ignorando el filtro de país global.
        return (processes?.filter(p => p.type === 'pmbok') as IPMBOKProcess[]) || [];
    }, [processes]);
    
    const scrumProcessesForGrid = useMemo(() => {
        // Esta lista siempre contiene TODOS los procesos Scrum, ignorando el filtro de país global.
        return (processes?.filter(p => p.type === 'scrum') as IScrumProcess[]) || [];
    }, [processes]);

    // 3. Filtrado local de PMBOK (por estatus/etapa) que se aplica a la lista completa.
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

                            {/* El tablero Kanban recibe la lista YA FILTRADA por el país seleccionado en la barra de navegación. */}
                            <KanbanBoard initialProcesses={displayedKanbanProcesses} />
                            
                            <hr className="border-t-2 border-gray-300 border-dashed" />
                            
                            {/* La sección Scrum recibe la lista COMPLETA de procesos Scrum, sin filtrar por país. */}
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
                                {/* La sección PMBOK recibe la lista COMPLETA de procesos PMBOK (con su propio filtro local). */}
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
