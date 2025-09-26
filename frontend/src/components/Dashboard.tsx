// frontend/src/components/Dashboard.tsx
import React, { useState, useMemo, useContext } from 'react'; // 👈 useContext AÑADIDO
import { useNavigate } from 'react-router-dom';
import { ProcessContext } from '../context/ProcessContext'; // 👈 CONTEXTO IMPORTADO
import DashboardNav from './dashboard/DashboardNav';
import FilterLegend from './dashboard/FilterLegend';
import ProcessGrid from './dashboard/ProcessGrid';
import KanbanBoard from './dashboard/KanbanBoard';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    // 👇 CAMBIO: Obtenemos los datos del contexto en lugar del hook
    const { processes, loading, error } = useContext(ProcessContext);

    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [selectedStage, setSelectedStage] = useState<string | null>(null);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
    };

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
        if (!processes) return [];
        return processes.filter(process => {
            const statusMatch = selectedStatus ? process.status?.name === selectedStatus : true;
            const stageMatch = selectedStage ? process.stage?.name?.startsWith(selectedStage) : true;
            return statusMatch && stageMatch;
        });
    }, [processes, selectedStatus, selectedStage]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-gray-100 text-gray-700">Cargando procesos...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen bg-gray-100 text-red-600 font-semibold">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <DashboardNav onLogout={handleLogout} />
            <main>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">

                    {/* El KanbanBoard ahora recibe los procesos directamente del contexto */}
                    {processes && <KanbanBoard initialProcesses={processes} />}

                    <header className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-800">Guía PMBOK 6ª Edición – 49 Procesos</h1>
                        <p className="text-gray-600 mt-2">Una visión adaptada a un entorno de trabajo ágil.</p>
                    </header>

                    <FilterLegend
                        selectedStatus={selectedStatus}
                        selectedStage={selectedStage}
                        onStatusFilterClick={handleStatusFilterClick}
                        onStageFilterClick={handleStageFilterClick}
                        onClearFilters={clearFilters}
                    />

                    <ProcessGrid processes={filteredProcesses} />
                </div>
            </main>
        </div>
    );
};

export default Dashboard;