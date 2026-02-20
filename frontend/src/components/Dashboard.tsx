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
import FloatingNav from './common/FloatingNav.tsx';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    
    const { processes, loading, error } = useContext(ProcessContext);
    
    const [selectedPmbokStatus, setSelectedPmbokStatus] = useState<string | null>(null);
    const [selectedPmbokStage, setSelectedPmbokStage] = useState<string | null>(null);

    // Procesos para las secciones inferiores (sin cambios).
    const pmbokProcessesForGrid = useMemo(() => {
        return (processes?.filter(p => p.type === 'pmbok') as IPMBOKProcess[]) || [];
    }, [processes]);
    
    const scrumProcessesForGrid = useMemo(() => {
        return (processes?.filter(p => p.type === 'scrum') as IScrumProcess[]) || [];
    }, [processes]);

    // Filtrado local de PMBOK (sin cambios).
    const filteredPmbokProcesses = useMemo(() => {
        return pmbokProcessesForGrid.filter(process => {
            const statusMatch = selectedPmbokStatus ? process.status?.name === selectedPmbokStatus : true;
            const stageMatch = selectedPmbokStage ? process.stage?.name?.startsWith(selectedPmbokStage) : true;
            return statusMatch && stageMatch;
        });
    }, [pmbokProcessesForGrid, selectedPmbokStatus, selectedPmbokStage]);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <DashboardNav onLogout={handleLogout} />
            <FloatingNav />
            <main>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">
                    
                    {loading && <div className="text-center text-gray-700 py-10">Cargando procesos...</div>}
                    {error && <div className="text-center text-red-600 font-semibold py-10">{error}</div>}
                    
                    {!loading && !error && (
                        <>
                            {/* 👇 INICIO DE LA CORRECCIÓN: Se añaden las etiquetas <section> con su 'id' */}
                            <section id="control-panel">
                                <SprintControlPanel />
                            </section>
                            
                            <section id="kanban-board">
                                <KanbanBoard />
                            </section>
                            
                            <hr className="border-t-2 border-gray-300 border-dashed" />
                            
                            <section id="scrum-guide">
                                <ScrumSection processes={scrumProcessesForGrid} />
                            </section>
                    
                            <hr className="border-t-2 border-gray-300 border-dashed" />

                            <section id="pmbok-guide">
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
                             {/* 👆 FIN DE LA CORRECCIÓN */}
                        </>
                    )}

                </div>
            </main>
        </div>
    );
};

export default Dashboard;
