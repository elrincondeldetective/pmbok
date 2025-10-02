#!/bin/bash

# Este script crea la estructura de directorios y archivos para el frontend refactorizado.
# Ejecútalo desde la raíz de tu proyecto (por ejemplo, desde /webapps/PMBOK-6/).

echo "Creando directorios..."
mkdir -p frontend/src/types
mkdir -p frontend/src/data
mkdir -p frontend/src/hooks
mkdir -p frontend/src/components/dashboard

# --- Creación de Archivos ---

echo "Creando archivos de tipos y datos..."

# 1. frontend/src/types/process.ts
cat << EOF > frontend/src/types/process.ts
// frontend/src/types/process.ts
export interface IProcessStatus {
    name: string;
    tailwind_bg_color: string;
    tailwind_text_color: string;
}

export interface IProcessStage {
    name: string;
    tailwind_bg_color: string;
    tailwind_text_color: string;
}

export interface IProcess {
    id: number;
    process_number: number;
    name: string;
    status: IProcessStatus | null;
    stage: IProcessStage | null;
    inputs: string;
    tools_and_techniques: string;
    outputs: string;
}
EOF

# 2. frontend/src/data/legendData.ts
cat << EOF > frontend/src/data/legendData.ts
// frontend/src/data/legendData.ts
export const statusLegendData = [
    { name: 'Base Estratégica', color: 'bg-indigo-800', description: 'Procesos que establecen la visión y el marco inicial del proyecto.' },
    { name: 'Ritmo de Sprint (2 Semanas)', color: 'bg-blue-700', description: 'Procesos integrados en las ceremonias de Scrum cada dos semanas.' },
    { name: 'Ritmo Diario', color: 'bg-green-600', description: 'Procesos que se viven en la colaboración y coordinación diaria.' },
    { name: 'Burocracia Innecesaria', color: 'bg-amber-500', description: 'Procesos formales reemplazados por prácticas ágiles para ganar velocidad.' },
    { name: 'Inaplicable', color: 'bg-gray-400', description: 'Procesos no aplicables a este modelo de proyecto ágil.' },
];

export const stageLegendData = [
    { name: 'Integración', color: 'bg-gray-200' },
    { name: 'Interesados', color: 'bg-purple-100' },
    { name: 'Alcance', color: 'bg-blue-100' },
    { name: 'Cronograma', color: 'bg-cyan-100' },
    { name: 'Costos', color: 'bg-green-100' },
    { name: 'Calidad', color: 'bg-red-100' },
    { name: 'Recursos', color: 'bg-lime-100' },
    { name: 'Comunicaciones', color: 'bg-rose-100' },
    { name: 'Riesgos', color: 'bg-amber-100' },
    { name: 'Adquisiciones', color: 'bg-orange-100' },
];
EOF

echo "Creando custom hook..."

# 3. frontend/src/hooks/useProcesses.ts
cat << EOF > frontend/src/hooks/useProcesses.ts
// frontend/src/hooks/useProcesses.ts
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import type { IProcess } from '../types/process';

export const useProcesses = () => {
    const navigate = useNavigate();
    const [processes, setProcesses] = useState<IProcess[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchProcesses = async () => {
            try {
                const response = await apiClient.get('/pmbok-processes/', {
                    signal: controller.signal
                });
                setProcesses(response.data);
            } catch (err: any) {
                if (err.name === 'CanceledError') {
                    console.log('Request canceled:', err.message);
                } else {
                    console.error("Error fetching processes:", err);
                    setError("Tu sesión puede haber expirado o hay un problema de red. Por favor, intenta iniciar sesión de nuevo.");
                    navigate('/login');
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchProcesses();

        return () => {
            controller.abort();
        };
    }, [navigate]);

    return { processes, loading, error };
};
EOF

echo "Creando componentes del dashboard..."

# 4. frontend/src/components/dashboard/DashboardNav.tsx
cat << EOF > frontend/src/components/dashboard/DashboardNav.tsx
// frontend/src/components/dashboard/DashboardNav.tsx
import React from 'react';

interface DashboardNavProps {
    onLogout: () => void;
}

const DashboardNav: React.FC<DashboardNavProps> = ({ onLogout }) => {
    return (
        <nav className="bg-white shadow-md sticky top-0 z-10">
            <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-800">Panel de Procesos PMBOK</h1>
                <button
                    onClick={onLogout}
                    className="bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition duration-300"
                >
                    Cerrar Sesión
                </button>
            </div>
        </nav>
    );
};

export default DashboardNav;
EOF

# 5. frontend/src/components/dashboard/FilterLegend.tsx
cat << EOF > frontend/src/components/dashboard/FilterLegend.tsx
// frontend/src/components/dashboard/FilterLegend.tsx
import React from 'react';
import { statusLegendData, stageLegendData } from '../../data/legendData';

interface FilterLegendProps {
    selectedStatus: string | null;
    selectedStage: string | null;
    onStatusFilterClick: (statusName: string) => void;
    onStageFilterClick: (stageName: string) => void;
    onClearFilters: () => void;
}

const FilterLegend: React.FC<FilterLegendProps> = ({
    selectedStatus,
    selectedStage,
    onStatusFilterClick,
    onStageFilterClick,
    onClearFilters,
}) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-12">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-700">Leyenda y Filtros</h3>
                {(selectedStatus || selectedStage) && (
                    <button
                        onClick={onClearFilters}
                        className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-1 px-3 rounded-full transition duration-200"
                    >
                        Limpiar Filtros
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                    <h4 className="font-semibold text-gray-600 mb-3">Estatus de Aplicabilidad</h4>
                    <div className="space-y-2">
                        {statusLegendData.map(item => (
                            <div
                                key={item.name}
                                className="flex items-center cursor-pointer group"
                                onClick={() => onStatusFilterClick(item.name)}
                            >
                                <span className={\`w-5 h-5 rounded-full mr-3 transition-all duration-200 \${selectedStatus === item.name ? 'ring-2 ring-offset-2 ring-blue-500' : ''} \${item.color}\`}></span>
                                <span className="text-sm group-hover:text-blue-600"><strong>{item.name}:</strong> {item.description}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-600 mb-3">Área de Conocimiento</h4>
                    <div className="flex flex-wrap gap-2">
                        {stageLegendData.map(item => (
                            <div
                                key={item.name}
                                className={\`flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 \${item.color} \${selectedStage === item.name ? 'ring-2 ring-blue-500' : 'hover:opacity-80'}\`}
                                onClick={() => onStageFilterClick(item.name)}
                            >
                                {item.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterLegend;
EOF

# 6. frontend/src/components/dashboard/ProcessCard.tsx
cat << EOF > frontend/src/components/dashboard/ProcessCard.tsx
// frontend/src/components/dashboard/ProcessCard.tsx
import React from 'react';
import type { IProcess } from '../../types/process';

interface ProcessCardProps {
    process: IProcess;
}

const ProcessCard: React.FC<ProcessCardProps> = ({ process }) => {
    return (
        <div className="bg-white rounded-lg shadow-lg flex flex-col transform hover:-translate-y-1 transition-transform duration-300">
            <div
                className={\`p-4 rounded-t-lg \${process.status ? \`\${process.status.tailwind_bg_color} \${process.status.tailwind_text_color}\` : 'bg-gray-500 text-white'}\`}
            >
                <h2 className="font-bold text-lg">{process.process_number}. {process.name}</h2>
            </div>

            <div className="p-6 flex-grow space-y-4">
                {process.inputs && <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Entradas</h3>
                    <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                        {process.inputs.split('\\n').map((item, index) => item && <li key={index}>{item}</li>)}
                    </ul>
                </div>}

                {process.tools_and_techniques && <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Herramientas y Técnicas</h3>
                    <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                        {process.tools_and_techniques.split('\\n').map((item, index) => item && <li key={index}>{item}</li>)}
                    </ul>
                </div>}

                {process.outputs && <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Salidas</h3>
                    <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                        {process.outputs.split('\\n').map((item, index) => item && <li key={index}>{item}</li>)}
                    </ul>
                </div>}
            </div>

            <div className={\`border-t p-4 rounded-b-lg mt-auto text-center \${process.stage ? \`\${process.stage.tailwind_bg_color} \${process.stage.tailwind_text_color}\` : 'bg-gray-200 text-gray-700'}\`}>
                <p className="text-xs font-bold uppercase tracking-wider">
                    {process.stage ? process.stage.name : 'Etapa no definida'}
                </p>
            </div>
        </div>
    );
};

export default ProcessCard;
EOF

# 7. frontend/src/components/dashboard/ProcessGrid.tsx
cat << EOF > frontend/src/components/dashboard/ProcessGrid.tsx
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
EOF

echo "Actualizando Dashboard.tsx..."

# 8. frontend/src/components/Dashboard.tsx
cat << EOF > frontend/src/components/Dashboard.tsx
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
EOF

echo ""
echo "¡Proceso completado!"
echo "Se han creado los directorios y archivos con el contenido inicial."
echo "Ahora puedes ejecutar 'git status' para ver los nuevos archivos y luego hacer 'git add .' y 'git commit'."
