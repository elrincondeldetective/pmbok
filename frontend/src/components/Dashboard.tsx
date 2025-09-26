// frontend/src/components/Dashboard.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Custom Hook para la lógica de datos
import { useProcesses } from '../hooks/useProcesses'; // <-- RUTA CORREGIDA

// Componentes de UI divididos
import DashboardNav from './dashboard/DashboardNav';
import FilterLegend from './dashboard/FilterLegend';
import ProcessGrid from './dashboard/ProcessGrid';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    
    // 1. La lógica de fetching está encapsulada en el hook
    const { processes, loading, error } = useProcesses();

    // 2. El estado de los filtros permanece en el componente padre/contenedor
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [selectedStage, setSelectedStage] = useState<string | null>(null);

    // 3. Manejadores de eventos para los filtros
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

    // 4. La lógica de filtrado se mantiene aquí, pero ahora es más legible.
    // useMemo optimiza para no recalcular en cada render si las dependencias no cambian.
    const filteredProcesses = useMemo(() => {
        if (!processes) return [];
        return processes.filter(process => {
            const statusMatch = selectedStatus ? process.status?.name === selectedStatus : true;
            const stageMatch = selectedStage ? process.stage?.name?.startsWith(selectedStage) : true;
            return statusMatch && stageMatch;
        });
    }, [processes, selectedStatus, selectedStage]);

    // 5. Renderizado condicional simple
    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-gray-100 text-gray-700">Cargando procesos...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen bg-gray-100 text-red-600 font-semibold">{error}</div>;
    }

    // 6. El JSX es ahora declarativo y compone los demás componentes
    return (
        <div className="min-h-screen bg-gray-100">
            <DashboardNav onLogout={handleLogout} />
            <main>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <header className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-800">Guía PMBOK 6ª Edición - 49 Procesos</h1>
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
